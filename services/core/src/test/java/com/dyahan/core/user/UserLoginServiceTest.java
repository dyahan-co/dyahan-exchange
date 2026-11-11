package com.dyahan.core.user;

import com.dyahan.core.user.api.LoginRequest;
import com.dyahan.core.user.api.LoginResult;
import com.dyahan.core.user.api.RegisterRequest;
import com.dyahan.core.user.api.RegistrationResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@Transactional
class UserLoginServiceTest {
    @Autowired
    private UserLoginService loginService;

    @Autowired
    private UserRegistrationService registrationService;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Test
    void logsInWithCaseInsensitiveNicknameAndCreatesHashedSession() {
        RegistrationResult registered = registrationService.register(
                new RegisterRequest("TestPlayer", "password123", true)
        );

        LoginResult result = loginService.login(
                new LoginRequest("  TESTPLAYER  ", "password123")
        );

        assertEquals(registered.userId(), result.userId());
        assertEquals("TestPlayer", result.nickname());
        assertEquals("PLAYER", result.role());
        assertEquals(43, result.sessionToken().length());
        assertTrue(result.sessionExpiresAt().isAfter(OffsetDateTime.now(ZoneOffset.UTC)));

        String sessionHash = sha256(result.sessionToken());
        UserSession session = userSessionRepository.findById(sessionHash).orElseThrow();

        assertEquals(result.userId(), session.getUserId());
        assertTrue(session.getExpiresAt().isAfter(OffsetDateTime.now(ZoneOffset.UTC)));
        assertFalse(userSessionRepository.findById(result.sessionToken()).isPresent());
    }

    @Test
    void usesSameErrorForUnknownNicknameAndWrongPassword() {
        registrationService.register(
                new RegisterRequest("TestPlayer", "password123", true)
        );

        InvalidCredentialsException wrongPassword = assertThrows(
                InvalidCredentialsException.class,
                () -> loginService.login(new LoginRequest("TestPlayer", "wrongpass"))
        );

        InvalidCredentialsException unknownNickname = assertThrows(
                InvalidCredentialsException.class,
                () -> loginService.login(new LoginRequest("UnknownUser", "password123"))
        );

        assertEquals(wrongPassword.getMessage(), unknownNickname.getMessage());
        assertEquals("Неверный ник или пароль", wrongPassword.getMessage());
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new AssertionError("SHA-256 должен быть доступен в Java", exception);
        }
    }
}