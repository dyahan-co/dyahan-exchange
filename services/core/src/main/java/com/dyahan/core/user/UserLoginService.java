package com.dyahan.core.user;

import com.dyahan.core.user.api.LoginRequest;
import com.dyahan.core.user.api.LoginResult;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UserLoginService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSessionService userSessionService;

    public UserLoginService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            UserSessionService userSessionService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userSessionService = userSessionService;
    }

    @Transactional
    public LoginResult login(LoginRequest request) {
        String nickname = request.nickname().strip();
        String normalizedNickname = nickname.toLowerCase(Locale.ROOT);

        User user = userRepository.findByNicknameNormalized(normalizedNickname)
                .orElseThrow(InvalidCredentialsException::new);

        if (!"ACTIVE".equals(user.getStatus())
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        UserSessionService.CreatedSession session =
                userSessionService.createSession(user.getId());

        return new LoginResult(
                user.getId(),
                user.getNickname(),
                user.getRole(),
                session.rawId(),
                session.expiresAt()
        );
    }
}