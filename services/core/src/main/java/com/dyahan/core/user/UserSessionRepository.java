package com.dyahan.core.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, String> {
    Optional<UserSession> findByIdHashAndRevokedAtIsNullAndExpiresAtAfter(
            String idHash,
            OffsetDateTime now
    );
}