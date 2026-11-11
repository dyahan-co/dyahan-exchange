package com.dyahan.core.guess;

import java.time.OffsetDateTime;
import java.util.UUID;

public record GuessSubmissionResult(
        UUID roundId,
        GuessRoundStatus status,
        short score,
        UUID rewardTransactionId,
        OffsetDateTime closedAt
) {
    public boolean isCorrect() {
        return status == GuessRoundStatus.WON;
    }
}