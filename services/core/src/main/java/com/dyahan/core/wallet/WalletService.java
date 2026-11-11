package com.dyahan.core.wallet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
public class WalletService {
    private static final String KUM = "KUM";
    private static final String DRUB = "DRUB";
    private static final String ISSUANCE_ACCOUNT = "KUM_ISSUANCE";
    private static final String REGISTRATION_BONUS = "REGISTRATION_BONUS";
    private static final long INITIAL_KUM = 100L;

    private final AccountRepository accountRepository;
    private final JournalTransactionRepository journalTransactionRepository;
    private final PostingRepository postingRepository;

    public WalletService(
            AccountRepository accountRepository,
            JournalTransactionRepository journalTransactionRepository,
            PostingRepository postingRepository
    ) {
        this.accountRepository = accountRepository;
        this.journalTransactionRepository = journalTransactionRepository;
        this.postingRepository = postingRepository;
    }

    @Transactional
    public void openAccountsForNewUser(UUID userId) {
        if (accountRepository.findByOwnerIdAndCurrency(userId, KUM).isPresent()
                || accountRepository.findByOwnerIdAndCurrency(userId, DRUB).isPresent()) {
            throw new IllegalStateException("Счета пользователя уже созданы");
        }

        Account kumAccount = new Account(UUID.randomUUID(), userId, KUM);
        Account drubAccount = new Account(UUID.randomUUID(), userId, DRUB);

        Account issuanceAccount = accountRepository
                .findByAccountTypeAndSystemCodeAndCurrency("SYSTEM", ISSUANCE_ACCOUNT, KUM)
                .orElseThrow(() -> new IllegalStateException(
                        "Не найден системный счёт выпуска KUM"
                ));

        kumAccount.applyDelta(INITIAL_KUM);
        issuanceAccount.applyDelta(-INITIAL_KUM);

        accountRepository.saveAllAndFlush(List.of(kumAccount, drubAccount));

        UUID transactionId = UUID.randomUUID();
        String idempotencyKey = "registration:" + userId;
        String requestHash = sha256(
                REGISTRATION_BONUS + "|" + userId + "|" + KUM + "|" + INITIAL_KUM
        );

        JournalTransaction transaction = new JournalTransaction(
                transactionId,
                userId,
                REGISTRATION_BONUS,
                userId,
                idempotencyKey,
                requestHash
        );

        journalTransactionRepository.saveAndFlush(transaction);

        postingRepository.saveAll(List.of(
                new Posting(
                        UUID.randomUUID(),
                        transaction,
                        kumAccount,
                        KUM,
                        INITIAL_KUM
                ),
                new Posting(
                        UUID.randomUUID(),
                        transaction,
                        issuanceAccount,
                        KUM,
                        -INITIAL_KUM
                )
        ));
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
}