package com.dyahan.core.user;

import com.dyahan.core.user.api.RegisterRequest;
import com.dyahan.core.user.api.RegistrationResult;
import com.dyahan.core.wallet.Account;
import com.dyahan.core.wallet.AccountRepository;
import com.dyahan.core.wallet.JournalTransaction;
import com.dyahan.core.wallet.JournalTransactionRepository;
import com.dyahan.core.wallet.Posting;
import com.dyahan.core.wallet.PostingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Transactional
class UserRegistrationServiceTest {
    @Autowired
    private UserRegistrationService registrationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JournalTransactionRepository journalTransactionRepository;

    @Autowired
    private PostingRepository postingRepository;

    @Autowired
    private UserSessionRepository userSessionRepository;

    @Test
    void registersUserWithWalletBalancedBonusAndHashedSession() {
        RegistrationResult result = registrationService.register(
                new RegisterRequest("TestPlayer", "password123", true)
        );

        User user = userRepository.findById(result.userId()).orElseThrow();

        assertEquals("TestPlayer", result.nickname());
        assertEquals("TestPlayer", user.getNickname());
        assertEquals("testplayer", user.getNicknameNormalized());
        assertNotEquals("password123", user.getPasswordHash());

        Account kumAccount = accountRepository
                .findByOwnerIdAndCurrency(user.getId(), "KUM")
                .orElseThrow();

        Account drubAccount = accountRepository
                .findByOwnerIdAndCurrency(user.getId(), "DRUB")
                .orElseThrow();

        assertEquals(100L, kumAccount.getBalanceMinor());
        assertEquals(0L, drubAccount.getBalanceMinor());

        JournalTransaction transaction = journalTransactionRepository
                .findByActorIdAndOperationTypeAndIdempotencyKey(
                        user.getId(),
                        "REGISTRATION_BONUS",
                        "registration:" + user.getId()
                )
                .orElseThrow();

        List<Posting> postings = postingRepository
                .findAllByTransaction_IdOrderByCreatedAtAscIdAsc(transaction.getId());

        assertEquals(2, postings.size());
        assertTrue(postings.stream().allMatch(posting -> "KUM".equals(posting.getCurrency())));
        assertEquals(0L, postings.stream().mapToLong(Posting::getDeltaMinor).sum());

        assertEquals(43, result.sessionToken().length());
        String sessionHash = sha256(result.sessionToken());
        UserSession session = userSessionRepository.findById(sessionHash).orElseThrow();

        assertEquals(user.getId(), session.getUserId());
        assertTrue(session.getExpiresAt().isAfter(OffsetDateTime.now(ZoneOffset.UTC)));
        assertFalse(userSessionRepository.findById(result.sessionToken()).isPresent());
    }

    @Test
    void rejectsNicknameThatDiffersOnlyByCase() {
        registrationService.register(
                new RegisterRequest("TestPlayer", "password123", true)
        );

        assertThrows(
                NicknameAlreadyTakenException.class,
                () -> registrationService.register(
                        new RegisterRequest("testplayer", "password456", true)
                )
        );
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new AssertionError("SHA-256 должен быть доступен в Java", exception);
        }
    }
}