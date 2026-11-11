CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(40) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,

    CONSTRAINT outbox_events_attempt_count_check
        CHECK (attempt_count >= 0),

    CONSTRAINT outbox_events_aggregate_event_unique
        UNIQUE (aggregate_type, aggregate_id, event_type)
);

CREATE INDEX outbox_events_unpublished_idx
    ON outbox_events (created_at, id)
    WHERE published_at IS NULL;