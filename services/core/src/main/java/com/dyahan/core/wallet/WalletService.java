package com.dyahan.core.wallet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class WalletService {
    private static final String KUM = "KUM";
    private static final String DRUB = "DRUB";
    private static final String SYSTEM_ACCOUNT = "SYSTEM";
    private static final String ISSUANCE_ACCOUNT = "KUM_ISSUANCE";
    private static final String REGISTRATION_BONUS = "REGISTRATION_BONUS";
    private static final String GUESS_REWARD = "GUESS_REWARD";
    private static final long INITIAL_KUM = 100L;
    private static final long GUESS_REWARD_KUM = 1L;

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
                .findSystemAccountForUpdate(SYSTEM_ACCOUNT, ISSUANCE_ACCOUNT, KUM)
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

    /**
     * Начисляет ровно одну KUM-награду за раунд.
     * Повторный вызов с теми же userId и roundId возвращает ID прежней транзакции.
     */
    @Transactional
    public UUID rewardGuess(UUID userId, UUID roundId) {
        if (userId == null || roundId == null) {
            throw new IllegalArgumentException("Для награды нужны userId и roundId");
        }

        // Сначала блокируем общий системный счёт: так повторные и конкурентные
        // начисления сериализуются до проверки ключа идемпотентности.
        Account issuanceAccount = accountRepository
                .findSystemAccountForUpdate(SYSTEM_ACCOUNT, ISSUANCE_ACCOUNT, KUM)
                .orElseThrow(() -> new IllegalStateException(
                        "Не найден системный счёт выпуска KUM"
                ));

        String idempotencyKey = "guess-round:" + roundId;
        String requestHash = sha256(
                GUESS_REWARD + "|" + userId + "|" + roundId + "|" + KUM + "|" + GUESS_REWARD_KUM
        );

        Optional<JournalTransaction> existingTransaction =
                journalTransactionRepository.findByActorIdAndOperationTypeAndIdempotencyKey(
                        userId,
                        GUESS_REWARD,
                        idempotencyKey
                );

        if (existingTransaction.isPresent()) {
            JournalTransaction transaction = existingTransaction.orElseThrow();

            if (!transaction.getRequestHash().equals(requestHash)) {
                throw new IdempotencyConflictException();
            }

            return transaction.getId();
        }

        Account userAccount = accountRepository
                .findUserAccountForUpdate(userId, KUM)
                .orElseThrow(() -> new IllegalStateException(
                        "Не найден KUM-счёт пользователя"
                ));

        userAccount.applyDelta(GUESS_REWARD_KUM);
        issuanceAccount.applyDelta(-GUESS_REWARD_KUM);

        accountRepository.saveAllAndFlush(List.of(userAccount, issuanceAccount));

        UUID transactionId = UUID.randomUUID();
        JournalTransaction transaction = new JournalTransaction(
                transactionId,
                userId,
                GUESS_REWARD,
                roundId,
                idempotencyKey,
                requestHash
        );
        journalTransactionRepository.saveAndFlush(transaction);

        postingRepository.saveAll(List.of(
                new Posting(
                        UUID.randomUUID(),
                        transaction,
                        userAccount,
                        KUM,
                        GUESS_REWARD_KUM
                ),
                new Posting(
                        UUID.randomUUID(),
                        transaction,
                        issuanceAccount,
                        KUM,
                        -GUESS_REWARD_KUM
                )
        ));

        return transactionId;
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