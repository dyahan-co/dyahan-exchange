CREATE TABLE guess_questions (
    id UUID PRIMARY KEY,
    image_object_key VARCHAR(512) NOT NULL,
    answer_normalized VARCHAR(240) NOT NULL,
    hint VARCHAR(240) NOT NULL,
    rules_version VARCHAR(40) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT guess_questions_answer_length
        CHECK (char_length(answer_normalized) BETWEEN 1 AND 240),

    CONSTRAINT guess_questions_hint_length
        CHECK (char_length(hint) BETWEEN 1 AND 240),

    CONSTRAINT guess_questions_rules_version_length
        CHECK (char_length(rules_version) BETWEEN 1 AND 40)
);

CREATE INDEX guess_questions_active_idx
    ON guess_questions (id)
    WHERE is_active = TRUE;

CREATE TABLE guess_question_aliases (
    question_id UUID NOT NULL REFERENCES guess_questions(id),
    answer_normalized VARCHAR(240) NOT NULL,

    CONSTRAINT guess_question_aliases_pk
        PRIMARY KEY (question_id, answer_normalized),

    CONSTRAINT guess_question_aliases_answer_length
        CHECK (char_length(answer_normalized) BETWEEN 1 AND 240)
);

CREATE TABLE guess_rounds (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    question_id UUID NOT NULL REFERENCES guess_questions(id),
    rules_version VARCHAR(40) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'OPEN',
    score SMALLINT,
    transaction_id UUID UNIQUE REFERENCES journal_transactions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT guess_rounds_status_check
        CHECK (status IN ('OPEN', 'WON', 'LOST', 'EXPIRED')),

    CONSTRAINT guess_rounds_score_check
        CHECK (score IS NULL OR score IN (0, 1)),

    CONSTRAINT guess_rounds_expiry_check
        CHECK (expires_at > created_at),

    CONSTRAINT guess_rounds_closed_state_check
        CHECK (
            (status = 'OPEN'
                AND score IS NULL
                AND transaction_id IS NULL
                AND closed_at IS NULL)
            OR
            (status = 'WON'
                AND score = 1
                AND transaction_id IS NOT NULL
                AND closed_at IS NOT NULL)
            OR
            (status IN ('LOST', 'EXPIRED')
                AND score = 0
                AND transaction_id IS NULL
                AND closed_at IS NOT NULL)
        )
);

CREATE UNIQUE INDEX guess_rounds_one_open_per_user
    ON guess_rounds (user_id)
    WHERE status = 'OPEN';

CREATE INDEX guess_rounds_user_created_idx
    ON guess_rounds (user_id, created_at DESC);

CREATE INDEX guess_rounds_expiry_idx
    ON guess_rounds (expires_at)
    WHERE status = 'OPEN';