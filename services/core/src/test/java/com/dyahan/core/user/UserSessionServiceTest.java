package com.dyahan.core.user;

import com.dyahan.core.user.api.RegisterRequest;
import com.dyahan.core.user.api.RegistrationResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class UserSessionServiceTest {
    @Autowired
    private UserSessionService sessionService;

    @Autowired
    private UserRegistrationService registrationService;

    @Test
    void findsActiveSessionAndStopsFindingItAfterRevocation() {
        RegistrationResult registered = registrationService.register(
                new RegisterRequest("SessionPlayer", "password123", true)
        );

        Optional<UUID> activeUserId =
                sessionService.findActiveUserId(registered.sessionToken());

        assertTrue(activeUserId.isPresent());
        assertEquals(registered.userId(), activeUserId.orElseThrow());

        sessionService.revoke(registered.sessionToken());

        assertFalse(sessionService.findActiveUserId(registered.sessionToken()).isPresent());
    }

    @Test
    void returnsEmptyForMissingSessionToken() {
        assertTrue(sessionService.findActiveUserId(null).isEmpty());
        assertTrue(sessionService.findActiveUserId("").isEmpty());
        assertTrue(sessionService.findActiveUserId("   ").isEmpty());
    }

    @Test
    void revokingMissingSessionDoesNothing() {
        sessionService.revoke("unknown-session-token");
    }
}