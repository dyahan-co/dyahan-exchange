package com.dyahan.core.user.api;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LoginResult(
        UUID userId,
        String nickname,
        String role,
        String sessionToken,
        OffsetDateTime sessionExpiresAt
) {
}