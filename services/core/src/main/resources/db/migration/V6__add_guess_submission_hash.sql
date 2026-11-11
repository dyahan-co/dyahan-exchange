ALTER TABLE guess_rounds
    ADD COLUMN submission_hash VARCHAR(64);

ALTER TABLE guess_rounds
    ADD CONSTRAINT guess_rounds_submission_hash_length
        CHECK (submission_hash IS NULL OR char_length(submission_hash) = 64);

ALTER TABLE guess_rounds
    ADD CONSTRAINT guess_rounds_submission_hash_state_check
        CHECK (
            (status IN ('WON', 'LOST') AND submission_hash IS NOT NULL)
            OR
            (status IN ('OPEN', 'EXPIRED') AND submission_hash IS NULL)
        );