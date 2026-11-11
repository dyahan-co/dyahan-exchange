package com.dyahan.core.guess;

import java.time.OffsetDateTime;
import java.util.UUID;

public record GuessRoundView(
        UUID roundId,
        String imageObjectKey,
        String hint,
        OffsetDateTime expiresAt
) {
}