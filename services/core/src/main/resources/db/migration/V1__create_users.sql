CREATE TABLE users (
    id UUID PRIMARY KEY,
    nickname VARCHAR(24) NOT NULL,
    nickname_normalized VARCHAR(24) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'PLAYER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notice_accepted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_nickname_length
        CHECK (char_length(nickname) BETWEEN 3 AND 24)
);