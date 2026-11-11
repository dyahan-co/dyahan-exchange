package com.dyahan.core.user;

import com.dyahan.core.user.api.RegisterRequest;
import com.dyahan.core.user.api.RegistrationResult;
import com.dyahan.core.wallet.WalletService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import java.util.UUID;

@Service
public class UserRegistrationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final WalletService walletService;
    private final UserSessionService userSessionService;

    public UserRegistrationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            WalletService walletService,
            UserSessionService userSessionService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.walletService = walletService;
        this.userSessionService = userSessionService;
    }

    @Transactional
    public RegistrationResult register(RegisterRequest request) {
        if (!request.noticeAccepted()) {
            throw new IllegalArgumentException(
                    "Нужно принять уведомление о виртуальной валюте"
            );
        }

        String nickname = request.nickname().strip();
        if (nickname.length() < 3 || nickname.length() > 24) {
            throw new IllegalArgumentException(
                    "Ник должен содержать от 3 до 24 символов"
            );
        }

        String normalizedNickname = nickname.toLowerCase(Locale.ROOT);
        if (userRepository.existsByNicknameNormalized(normalizedNickname)) {
            throw new NicknameAlreadyTakenException();
        }

        User user = new User(
                UUID.randomUUID(),
                nickname,
                normalizedNickname,
                passwordEncoder.encode(request.password()),
                OffsetDateTime.now(ZoneOffset.UTC)
        );

        User savedUser = userRepository.saveAndFlush(user);
        walletService.openAccountsForNewUser(savedUser.getId());

        UserSessionService.CreatedSession session =
                userSessionService.createSession(savedUser.getId());

        return new RegistrationResult(
                savedUser.getId(),
                savedUser.getNickname(),
                savedUser.getRole(),
                session.rawId(),
                session.expiresAt()
        );
    }
}