package com.dyahan.core.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserSessionService {
    private static final Duration SESSION_TTL = Duration.ofHours(24);

    private final UserSessionRepository userSessionRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public UserSessionService(UserSessionRepository userSessionRepository) {
        this.userSessionRepository = userSessionRepository;
    }

    @Transactional
    public CreatedSession createSession(UUID userId) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        String rawSessionId = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        OffsetDateTime expiresAt = OffsetDateTime.now(ZoneOffset.UTC)
                .plus(SESSION_TTL);

        UserSession session = new UserSession(
                sha256(rawSessionId),
                userId,
                expiresAt
        );

        userSessionRepository.save(session);

        return new CreatedSession(rawSessionId, expiresAt);
    }

    @Transactional(readOnly = true)
    public Optional<UUID> findActiveUserId(String rawSessionId) {
        if (rawSessionId == null || rawSessionId.isBlank()) {
            return Optional.empty();
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        return userSessionRepository
                .findByIdHashAndRevokedAtIsNullAndExpiresAtAfter(
                        sha256(rawSessionId),
                        now
                )
                .map(UserSession::getUserId);
    }

    @Transactional
    public void revoke(String rawSessionId) {
        if (rawSessionId == null || rawSessionId.isBlank()) {
            return;
        }

        userSessionRepository.findById(sha256(rawSessionId))
                .ifPresent(session ->
                        session.revoke(OffsetDateTime.now(ZoneOffset.UTC))
                );
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 недоступен", exception);
        }
    }

    public record CreatedSession(String rawId, OffsetDateTime expiresAt) {
    }
}