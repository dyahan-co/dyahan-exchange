package com.dyahan.core.wallet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class WalletService {

  private static final String KUM = "KUM";
  private static final String DRUB = "DRUB";

  private static final String SYSTEM = "SYSTEM";
  private static final String USER = "USER";

  private static final String ISSUANCE_ACCOUNT = "KUM_ISSUANCE";
  private static final String ROULETTE_HOUSE = "ROULETTE_HOUSE";

  private static final String REGISTRATION_BONUS = "REGISTRATION_BONUS";

  private static final long INITIAL_KUM = 100L;
  private static final long ROULETTE_STAKE = 2L;

  private final AccountRepository accountRepository;
  private final JournalTransactionRepository transactionRepository;
  private final PostingRepository postingRepository;
  private final HoldRepository holdRepository;

  public WalletService(
    AccountRepository accountRepository,
    JournalTransactionRepository transactionRepository,
    PostingRepository postingRepository,
    HoldRepository holdRepository
  ) {
    this.accountRepository = accountRepository;
    this.transactionRepository = transactionRepository;
    this.postingRepository = postingRepository;
    this.holdRepository = holdRepository;
  }

  /**
   * Создание счетов и стартовое начисление.
   * При вызове из регистрации участвует в её транзакции.
   */
  @Transactional
  public void openAccountsForNewUser(UUID userId) {
    Objects.requireNonNull(userId, "Не указан пользователь");

    if (accountRepository
      .findByOwnerIdAndCurrency(userId, KUM)
      .isPresent()
      || accountRepository
      .findByOwnerIdAndCurrency(userId, DRUB)
      .isPresent()) {
      throw new IllegalStateException(
        "Счета пользователя уже созданы"
      );
    }

    Account issuanceReference = requireSystemAccount(
      ISSUANCE_ACCOUNT
    );

    // Стартовое начисление также защищаем блокировкой
    // системного счёта при параллельных регистрациях.
    Account issuanceAccount = accountRepository
      .findAllByIdForUpdate(List.of(issuanceReference.getId()))
      .stream()
      .findFirst()
      .orElseThrow(() -> new IllegalStateException(
        "Системный счёт выпуска не найден"
      ));

    Account kumAccount = new Account(
      UUID.randomUUID(),
      userId,
      KUM
    );

    Account drubAccount = new Account(
      UUID.randomUUID(),
      userId,
      DRUB
    );

    kumAccount.applyDelta(INITIAL_KUM);
    issuanceAccount.applyDelta(-INITIAL_KUM);

    accountRepository.saveAllAndFlush(
      List.of(kumAccount, drubAccount)
    );

    JournalTransaction transaction = createTransaction(
      userId,
      REGISTRATION_BONUS,
      userId,
      "registration:" + userId,
      sha256(
        REGISTRATION_BONUS
          + "|" + userId
          + "|" + KUM
          + "|" + INITIAL_KUM
      )
    );

    savePostings(
      transaction,
      kumAccount,
      issuanceAccount,
      INITIAL_KUM
    );
  }

  /**
   * Создаёт резерв ставки.
   *
   * Метод вызывается из сервиса создания раунда,
   * внутри уже открытой транзакции.
   */
  @Transactional(propagation = Propagation.MANDATORY)
  public Hold reserveRouletteStake(
    UUID userId,
    UUID roundId,
    UUID holdId,
    OffsetDateTime createdAt,
    OffsetDateTime expiresAt
  ) {
    Objects.requireNonNull(userId);
    Objects.requireNonNull(roundId);
    Objects.requireNonNull(holdId);
    Objects.requireNonNull(createdAt);
    Objects.requireNonNull(expiresAt);

    Account account = accountRepository
      .findUserAccountForUpdate(userId, KUM)
      .orElseThrow(() -> new IllegalStateException(
        "Кошелёк пользователя не найден"
      ));

    // Создание раунда будет обрабатывать повтор запроса
    // раньше этого вызова. Здесь проверяем внутренний инвариант.
    if (holdRepository
      .findByAccountIdAndReasonAndEntityId(
        account.getId(),
        Hold.ROULETTE_STAKE,
        roundId
      )
      .isPresent()) {
      throw new IllegalStateException(
        "Резерв для этого раунда уже существует"
      );
    }

    account.reserve(ROULETTE_STAKE);

    Hold hold = new Hold(
      holdId,
      account.getId(),
      ROULETTE_STAKE,
      Hold.ROULETTE_STAKE,
      roundId,
      createdAt,
      expiresAt
    );

    // Резерв должен существовать до INSERT roulette_rounds,
    // поскольку миграция содержит внешний ключ на holds.
    return holdRepository.saveAndFlush(hold);
  }

  /**
   * Проводит финансовый результат раунда.
   *
   * Вызывающий сервис обязан:
   * 1. Заблокировать раунд.
   * 2. Проверить статус PENDING и наступление revealAt.
   * 3. Передать результат из БД, а не из HTTP-запроса.
   * 4. Завершить раунд в этой же транзакции.
   */
  @Transactional(propagation = Propagation.MANDATORY)
  public RouletteSettlement settleRoulette(
    UUID userId,
    UUID roundId,
    UUID accountId,
    UUID holdId,
    int result,
    OffsetDateTime now
  ) {
    Objects.requireNonNull(userId);
    Objects.requireNonNull(roundId);
    Objects.requireNonNull(accountId);
    Objects.requireNonNull(holdId);
    Objects.requireNonNull(now);

    if (result < 1 || result > 10) {
      throw new IllegalArgumentException(
        "Результат рулетки должен быть от 1 до 10"
      );
    }

    Account houseReference = requireSystemAccount(
      ROULETTE_HOUSE
    );

    // Счёт игрока и счёт казино блокируются одним запросом
    // в одинаковом порядке по UUID.
    List<Account> lockedAccounts = accountRepository
      .findAllByIdForUpdate(
        List.of(accountId, houseReference.getId())
      );

    Account player = findLockedAccount(
      lockedAccounts,
      accountId
    );

    Account house = findLockedAccount(
      lockedAccounts,
      houseReference.getId()
    );

    requirePlayerAccount(player, userId);

    Hold hold = holdRepository
      .findByIdForUpdate(holdId)
      .orElseThrow(() -> new IllegalStateException(
        "Резерв ставки не найден"
      ));

    requireRouletteHold(hold, player.getId(), roundId);

    long balanceBefore = player.getBalanceMinor();
    long delta;
    String operationType;

    if (result == 7) {
      // Освобождаем только резерв этого раунда.
      // Чужие резервы остаются заблокированными.
      player.release(hold.getAmountMinor());
      hold.release(now);

      long penalty = Math.min(
        100L,
        player.getAvailableMinor()
      );

      if (penalty <= 0) {
        throw new IllegalStateException(
          "Нарушено обеспечение резерва рулетки"
        );
      }

      delta = -penalty;
      operationType = "ROULETTE_GREEN";

      player.applyDelta(delta);
    } else if (result <= 5) {
      player.release(hold.getAmountMinor());
      hold.release(now);

      delta = ROULETTE_STAKE;
      operationType = "ROULETTE_WIN";

      player.applyDelta(delta);
    } else {
      delta = -ROULETTE_STAKE;
      operationType = "ROULETTE_LOSS";

      player.capture(hold.getAmountMinor());
      hold.capture(now);
    }

    // Противоположное изменение системного счёта.
    house.applyDelta(Math.negateExact(delta));

    String idempotencyKey = "roulette:settle:" + roundId;

    String requestHash = sha256(
      "ROULETTE_SETTLEMENT"
        + "|" + userId
        + "|" + roundId
        + "|" + result
        + "|rules:1"
    );

    JournalTransaction transaction = createTransaction(
      userId,
      operationType,
      roundId,
      idempotencyKey,
      requestHash
    );

    savePostings(
      transaction,
      player,
      house,
      delta
    );

    return new RouletteSettlement(
      transaction.getId(),
      balanceBefore,
      player.getBalanceMinor(),
      delta,
      player.getAvailableMinor(),
      player.getHeldMinor()
    );
  }

  @Transactional(readOnly = true)
  public WalletSnapshot getKumSnapshot(UUID userId) {
    Objects.requireNonNull(userId);

    Account account = accountRepository
      .findByOwnerIdAndCurrency(userId, KUM)
      .orElseThrow(() -> new IllegalStateException(
        "Кошелёк пользователя не найден"
      ));

    return new WalletSnapshot(
      account.getBalanceMinor(),
      account.getAvailableMinor(),
      account.getHeldMinor()
    );
  }

  private Account requireSystemAccount(String systemCode) {
    return accountRepository
      .findByAccountTypeAndSystemCodeAndCurrency(
        SYSTEM,
        systemCode,
        KUM
      )
      .orElseThrow(() -> new IllegalStateException(
        "Не найден системный счёт " + systemCode
      ));
  }

  private Account findLockedAccount(
    List<Account> accounts,
    UUID id
  ) {
    return accounts.stream()
      .filter(account -> id.equals(account.getId()))
      .findFirst()
      .orElseThrow(() -> new IllegalStateException(
        "Счёт не найден: " + id
      ));
  }

  private void requirePlayerAccount(
    Account account,
    UUID userId
  ) {
    if (!USER.equals(account.getAccountType())
      || !userId.equals(account.getOwnerId())
      || !KUM.equals(account.getCurrency())) {
      throw new IllegalStateException(
        "Счёт не принадлежит игроку или имеет другую валюту"
      );
    }
  }

  private void requireRouletteHold(
    Hold hold,
    UUID accountId,
    UUID roundId
  ) {
    if (!hold.isActive()) {
      throw new IllegalStateException(
        "Резерв ставки уже закрыт"
      );
    }

    if (!accountId.equals(hold.getAccountId())
      || !roundId.equals(hold.getEntityId())
      || !Hold.ROULETTE_STAKE.equals(hold.getReason())
      || hold.getAmountMinor() != ROULETTE_STAKE) {
      throw new IllegalStateException(
        "Резерв не соответствует ставке этого раунда"
      );
    }
  }

  private JournalTransaction createTransaction(
    UUID actorId,
    String operationType,
    UUID entityId,
    String idempotencyKey,
    String requestHash
  ) {
    JournalTransaction transaction = new JournalTransaction(
      UUID.randomUUID(),
      actorId,
      operationType,
      entityId,
      idempotencyKey,
      requestHash
    );

    return transactionRepository.saveAndFlush(transaction);
  }

  /**
   * Создаёт две противоположные проводки.
   * playerDelta может быть положительным или отрицательным.
   */
  private void savePostings(
    JournalTransaction transaction,
    Account player,
    Account system,
    long playerDelta
  ) {
    if (playerDelta == 0) {
      throw new IllegalArgumentException(
        "Нельзя создать нулевые проводки"
      );
    }

    postingRepository.saveAll(
      List.of(
        new Posting(
          UUID.randomUUID(),
          transaction,
          player,
          KUM,
          playerDelta
        ),
        new Posting(
          UUID.randomUUID(),
          transaction,
          system,
          KUM,
          Math.negateExact(playerDelta)
        )
      )
    );
  }

  private static String sha256(String value) {
    try {
      byte[] hash = MessageDigest.getInstance("SHA-256")
        .digest(value.getBytes(StandardCharsets.UTF_8));

      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException(
        "SHA-256 недоступен",
        exception
      );
    }
  }

  public record WalletSnapshot(
    long balanceMinor,
    long availableMinor,
    long heldMinor
  ) {
  }

  public record RouletteSettlement(
    UUID transactionId,
    long balanceBeforeMinor,
    long balanceAfterMinor,
    long deltaMinor,
    long availableMinor,
    long heldMinor
  ) {
  }
}
