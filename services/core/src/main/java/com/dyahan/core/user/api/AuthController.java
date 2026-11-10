package com.dyahan.core.user.api;

import com.dyahan.core.user.User;
import com.dyahan.core.user.UserLoginService;
import com.dyahan.core.user.UserRegistrationService;
import com.dyahan.core.user.UserRepository;
import com.dyahan.core.user.UserSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final UserRegistrationService registrationService;
    private final UserLoginService loginService;
    private final UserSessionService userSessionService;
    private final UserRepository userRepository;
    private final CurrentUserResolver currentUserResolver;

    public AuthController(
            UserRegistrationService registrationService,
            UserLoginService loginService,
            UserSessionService userSessionService,
            UserRepository userRepository,
            CurrentUserResolver currentUserResolver
    ) {
        this.registrationService = registrationService;
        this.loginService = loginService;
        this.userSessionService = userSessionService;
        this.userRepository = userRepository;
        this.currentUserResolver = currentUserResolver;
    }

    @PostMapping("/register")
    public ResponseEntity<RegistrationResult> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(registrationService.register(request));
    }

    @PostMapping("/login")
    public LoginResult login(@Valid @RequestBody LoginRequest request) {
        return loginService.login(request);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false)
            String authorizationHeader
    ) {
        UUID userId = currentUserResolver.requireUserId(authorizationHeader);

        String token = authorizationHeader.substring("Bearer ".length()).strip();
        userSessionService.revoke(token);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public MeResponse me(
            @RequestHeader(value = "Authorization", required = false)
            String authorizationHeader
    ) {
        UUID userId = currentUserResolver.requireUserId(authorizationHeader);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException(
                        "Пользователь с действующей сессией не найден"
                ));

        return new MeResponse(
                user.getId(),
                user.getNickname(),
                user.getRole(),
                user.getStatus()
        );
    }

    public record MeResponse(
            UUID userId,
            String nickname,
            String role,
            String status
    ) {
    }
}