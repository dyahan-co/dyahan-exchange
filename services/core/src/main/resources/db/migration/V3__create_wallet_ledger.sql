CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    owner_id UUID REFERENCES users(id),
    account_type VARCHAR(10) NOT NULL,
    system_code VARCHAR(40),
    currency VARCHAR(10) NOT NULL,
    balance_minor BIGINT NOT NULL DEFAULT 0,
    held_minor BIGINT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT accounts_currency_check
        CHECK (currency IN ('KUM', 'DRUB')),

    CONSTRAINT accounts_type_check
        CHECK (account_type IN ('USER', 'SYSTEM')),

    CONSTRAINT accounts_owner_system_shape_check
        CHECK (
            (account_type = 'USER' AND owner_id IS NOT NULL AND system_code IS NULL)
            OR
            (account_type = 'SYSTEM' AND owner_id IS NULL AND system_code IS NOT NULL)
        ),

    CONSTRAINT accounts_held_non_negative
        CHECK (held_minor >= 0),

    CONSTRAINT accounts_user_balance_check
        CHECK (
            account_type = 'SYSTEM'
            OR (balance_minor >= 0 AND held_minor <= balance_minor)
        ),

    CONSTRAINT accounts_system_no_holds
        CHECK (account_type <> 'SYSTEM' OR held_minor = 0),

    CONSTRAINT accounts_id_currency_unique
        UNIQUE (id, currency)
);

CREATE UNIQUE INDEX accounts_user_owner_currency_unique
    ON accounts (owner_id, currency)
    WHERE account_type = 'USER';

CREATE UNIQUE INDEX accounts_system_code_currency_unique
    ON accounts (system_code, currency)
    WHERE account_type = 'SYSTEM';

CREATE TABLE journal_transactions (
    id UUID PRIMARY KEY,
    actor_id UUID REFERENCES users(id),
    operation_type VARCHAR(40) NOT NULL,
    entity_id UUID,
    idempotency_key VARCHAR(120) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX journal_user_idempotency_unique
    ON journal_transactions (actor_id, operation_type, idempotency_key)
    WHERE actor_id IS NOT NULL;

CREATE UNIQUE INDEX journal_system_idempotency_unique
    ON journal_transactions (operation_type, idempotency_key)
    WHERE actor_id IS NULL;

CREATE TABLE postings (
    id UUID PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES journal_transactions(id),
    account_id UUID NOT NULL,
    currency VARCHAR(10) NOT NULL,
    delta_minor BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT postings_non_zero_delta
        CHECK (delta_minor <> 0),

    CONSTRAINT postings_account_currency_fk
        FOREIGN KEY (account_id, currency)
        REFERENCES accounts (id, currency)
);

CREATE INDEX postings_account_created_idx
    ON postings (account_id, created_at, id);

INSERT INTO accounts (
    id,
    account_type,
    system_code,
    currency
)
VALUES (
    gen_random_uuid(),
    'SYSTEM',
    'KUM_ISSUANCE',
    'KUM'
);