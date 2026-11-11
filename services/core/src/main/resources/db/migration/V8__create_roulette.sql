-- Общие резервы кошелька.
-- accounts.held_minor остаётся агрегированным размером резервов.
-- Все изменения holds и accounts выполняются одной транзакцией.

CREATE TABLE holds (
                     id UUID PRIMARY KEY,

                     account_id UUID NOT NULL
                       REFERENCES accounts(id),

                     amount_minor BIGINT NOT NULL,

                     reason VARCHAR(40) NOT NULL,
                     entity_id UUID NOT NULL,

                     status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

                     created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                     expires_at TIMESTAMPTZ NOT NULL,
                     closed_at TIMESTAMPTZ,

                     CONSTRAINT holds_positive_amount
                       CHECK (amount_minor > 0),

                     CONSTRAINT holds_reason_not_blank
                       CHECK (btrim(reason) <> ''),

                     CONSTRAINT holds_status_check
                       CHECK (status IN ('ACTIVE', 'CAPTURED', 'RELEASED')),

                     CONSTRAINT holds_expiry_check
                       CHECK (expires_at > created_at),

                     CONSTRAINT holds_closed_at_check
                       CHECK (
                         (status = 'ACTIVE' AND closed_at IS NULL)
                           OR
                         (
                           status IN ('CAPTURED', 'RELEASED')
                             AND closed_at IS NOT NULL
                             AND closed_at >= created_at
                           )
                         ),

                     CONSTRAINT holds_entity_account_unique
                       UNIQUE (account_id, reason, entity_id),

  -- Используется для проверки связи раунда с его резервом.
                     CONSTRAINT holds_round_reference_unique
                       UNIQUE (id, entity_id, account_id, amount_minor)
);

CREATE INDEX holds_active_account_idx
  ON holds(account_id)
  WHERE status = 'ACTIVE';

CREATE INDEX holds_active_expiry_idx
  ON holds(expires_at)
  WHERE status = 'ACTIVE';


-- Раунды рулетки.
-- secret_result и nonce никогда не выдаются клиенту до раскрытия.

CREATE TABLE roulette_rounds (
                               id UUID PRIMARY KEY,

                               user_id UUID NOT NULL
                                 REFERENCES users(id),

                               account_id UUID NOT NULL,

                               currency VARCHAR(10) NOT NULL DEFAULT 'KUM',
                               stake_minor BIGINT NOT NULL DEFAULT 2,

                               hold_id UUID NOT NULL UNIQUE,

                               idempotency_key VARCHAR(120) NOT NULL,
                               request_hash VARCHAR(64) NOT NULL,

                               rules_version INTEGER NOT NULL DEFAULT 1,

                               secret_result SMALLINT NOT NULL,
                               nonce VARCHAR(64) NOT NULL,
                               commit_hash VARCHAR(64) NOT NULL,

                               status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                               outcome VARCHAR(20),

                               created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                               reveal_at TIMESTAMPTZ NOT NULL,
                               settled_at TIMESTAMPTZ,

  -- Фактически проведённое изменение баланса.
                               delta_minor BIGINT,

  -- Снимки общего баланса непосредственно до и после расчёта.
                               balance_before_minor BIGINT,
                               balance_after_minor BIGINT,

                               settlement_transaction_id UUID UNIQUE
                                 REFERENCES journal_transactions(id),

                               CONSTRAINT roulette_currency_check
                                 CHECK (currency = 'KUM'),

                               CONSTRAINT roulette_stake_check
                                 CHECK (stake_minor = 2),

                               CONSTRAINT roulette_rules_version_check
                                 CHECK (rules_version = 1),

                               CONSTRAINT roulette_result_check
                                 CHECK (secret_result BETWEEN 1 AND 10),

                               CONSTRAINT roulette_key_not_blank
                                 CHECK (btrim(idempotency_key) <> ''),

                               CONSTRAINT roulette_request_hash_check
                                 CHECK (request_hash ~ '^[0-9a-f]{64}$'),

    CONSTRAINT roulette_nonce_check
        CHECK (nonce ~ '^[0-9a-f]{64}$'),

    CONSTRAINT roulette_commit_hash_check
        CHECK (commit_hash ~ '^[0-9a-f]{64}$'),

    CONSTRAINT roulette_reveal_time_check
        CHECK (reveal_at > created_at),

    CONSTRAINT roulette_status_check
        CHECK (status IN ('PENDING', 'SETTLED')),

    CONSTRAINT roulette_outcome_check
        CHECK (
            outcome IS NULL
            OR outcome IN ('WIN', 'LOSS', 'GREEN')
        ),

    CONSTRAINT roulette_user_key_unique
        UNIQUE (user_id, idempotency_key),

    CONSTRAINT roulette_account_currency_fk
        FOREIGN KEY (account_id, currency)
        REFERENCES accounts(id, currency),

    -- Резерв должен принадлежать именно этому раунду,
    -- именно этому счёту и иметь размер ставки.
    CONSTRAINT roulette_hold_fk
        FOREIGN KEY (hold_id, id, account_id, stake_minor)
        REFERENCES holds(id, entity_id, account_id, amount_minor),

    CONSTRAINT roulette_settlement_shape_check
        CHECK (
            (
                status = 'PENDING'
                AND outcome IS NULL
                AND settled_at IS NULL
                AND delta_minor IS NULL
                AND balance_before_minor IS NULL
                AND balance_after_minor IS NULL
                AND settlement_transaction_id IS NULL
            )
            OR
            (
                status = 'SETTLED'
                AND outcome IS NOT NULL
                AND settled_at IS NOT NULL
                AND settled_at >= reveal_at
                AND delta_minor IS NOT NULL
                AND balance_before_minor IS NOT NULL
                AND balance_after_minor IS NOT NULL
                AND balance_before_minor >= 0
                AND balance_after_minor >= 0
                AND balance_after_minor =
                    balance_before_minor + delta_minor
                AND settlement_transaction_id IS NOT NULL
            )
        ),

    CONSTRAINT roulette_outcome_result_check
        CHECK (
            outcome IS NULL
            OR
            (
                outcome = 'WIN'
                AND secret_result BETWEEN 1 AND 5
                AND delta_minor = 2
            )
            OR
            (
                outcome = 'LOSS'
                AND secret_result IN (6, 8, 9, 10)
                AND delta_minor = -2
            )
            OR
            (
                outcome = 'GREEN'
                AND secret_result = 7
                AND delta_minor BETWEEN -100 AND 0
            )
        )
);

-- Даже два параллельных запроса с разными ключами
-- не смогут создать два активных раунда одному игроку.
CREATE UNIQUE INDEX roulette_one_pending_per_user
  ON roulette_rounds(user_id)
  WHERE status = 'PENDING';

-- Серверное задание находит раунды, готовые к расчёту.
CREATE INDEX roulette_pending_deadline_idx
  ON roulette_rounds(reveal_at, id)
  WHERE status = 'PENDING';

CREATE INDEX roulette_user_history_idx
  ON roulette_rounds(user_id, created_at DESC, id DESC);


-- Ограничения аккаунта.
-- Эта таблица отделена от sessions и users.status:
-- запрет P2P не должен запрещать вход в аккаунт.

CREATE TABLE user_restrictions (
                                 user_id UUID NOT NULL
                                   REFERENCES users(id),

                                 restriction_type VARCHAR(40) NOT NULL,

                                 blocked_until TIMESTAMPTZ NOT NULL,
                                 reason VARCHAR(80) NOT NULL,

                                 source_roulette_round_id UUID NOT NULL
                                   REFERENCES roulette_rounds(id),

                                 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                 PRIMARY KEY (user_id, restriction_type),

                                 CONSTRAINT user_restrictions_type_check
                                   CHECK (restriction_type = 'P2P_BLOCK'),

                                 CONSTRAINT user_restrictions_reason_check
                                   CHECK (reason = 'ROULETTE_GREEN')
);

CREATE INDEX user_restrictions_expiry_idx
  ON user_restrictions(blocked_until);


-- Системный счёт казино.
-- Выигрыш: казино -2, игрок +2.
-- Проигрыш/штраф: игрок -N, казино +N.
-- Сумма проводок по каждой операции равна нулю.

INSERT INTO accounts (
  id,
  account_type,
  system_code,
  currency
)
VALUES (
         gen_random_uuid(),
         'SYSTEM',
         'ROULETTE_HOUSE',
         'KUM'
       );
