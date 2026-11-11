package com.dyahan.core.roulette;

import com.dyahan.core.user.User;
import com.dyahan.core.user.UserRepository;
import com.dyahan.core.user.UserRestrictionService;
import com.dyahan.core.wallet.Hold;
import com.dyahan.core.wallet.WalletService;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class RouletteService {

  private static final long ROUND_DURATION_SECONDS = 3L;

  private final RouletteRoundRepository roundRepository;
  private final UserRepository userRepository;
  private final WalletService walletService;
  private final UserRestrictionService restrictionService;

  private final Clock clock;
  private final SecureRandom random;

  public RouletteService(
    RouletteRoundRepository roundRepository,
    UserRepository userRepository,
    WalletService walletService,
    UserRestrictionService restrictionService,
    @Qualifier("rouletteClock") Clock clock,
    @Qualifier("rouletteRandom") SecureRandom random
  ) {
    this.roundRepository = roundRepository;
    this.userRepository = userRepository;
    this.walletService = walletService;
    this.restrictionService = restrictionService;
    this.clock = clock;
    this.random = random;
  }

  /**
   * Возвращает сущность только для использования внутри backend.
   * Контроллер обязан преобразовать её в безопасный DTO.
   */
  @Transactional
  public RouletteRound createRound(
    UUID userId,
    UUID idempotencyKey
  ) {
    Objects.requireNonNull(userId, "Не указан пользователь");
    Objects.requireNonNull(
      idempotencyKey,
      "Не указан ключ идемпотентности"
    );

    User user = lockUser(userId);

    String key = idempotencyKey.toString();

    String requestHash = sha256(
      "ROULETTE_START"
        + "|" + userId
        + "|KUM"
        + "|" + RouletteRound.STAKE
        + "|rules:1"
    );

    Optional<RouletteRound> existing = roundRepository
      .findByUserIdAndIdempotencyKey(userId, key);

    // Повтор уже принятой команды не создаёт новую ставку.
    if (existing.isPresent()) {
      RouletteRound round = existing.orElseThrow();

      if (!requestHash.equals(round.getRequestHash())) {
        throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "Ключ уже использован для другого запроса"
        );
      }

      return round;
    }

    if (!"ACTIVE".equals(user.getStatus())) {
      throw new ResponseStatusException(
        HttpStatus.FORBIDDEN,
        "Аккаунт не может начинать новые игры"
      );
    }

    if (roundRepository
      .findByUserIdAndStatus(
        userId,
        RouletteRound.PENDING
      )
      .isPresent()) {
      throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Предыдущий раунд ещё не завершён"
      );
    }

    OffsetDateTime createdAt = now();
    OffsetDateTime revealAt = createdAt.plusSeconds(
      ROUND_DURATION_SECONDS
    );

    UUID roundId = UUID.randomUUID();
    UUID holdId = UUID.randomUUID();

    Hold hold = walletService.reserveRouletteStake(
      userId,
      roundId,
      holdId,
      createdAt,
      revealAt
    );

    int result = random.nextInt(10) + 1;

    byte[] nonceBytes = new byte[32];
    random.nextBytes(nonceBytes);

    String nonce = HexFormat.of().formatHex(nonceBytes);

    RouletteRound round = new RouletteRound(
      roundId,
      userId,
      hold.getAccountId(),
      hold.getId(),
      key,
      requestHash,
      result,
      nonce,
      createdAt,
      revealAt
    );

    return roundRepository.saveAndFlush(round);
  }

  /**
   * Читает только раунд указанного пользователя.
   * GET-запрос не должен проводить финансовый расчёт.
   */
  @Transactional(readOnly = true)
  public RouletteRound getRound(UUID userId, UUID roundId) {
    Objects.requireNonNull(userId);
    Objects.requireNonNull(roundId);

    return roundRepository
      .findByIdAndUserId(roundId, userId)
      .orElseThrow(() -> new ResponseStatusException(
        HttpStatus.NOT_FOUND,
        "Раунд не найден"
      ));
  }

  /**
   * Используется при восстановлении страницы.
   */
  @Transactional(readOnly = true)
  public Optional<RouletteRound> findPendingRound(UUID userId) {
    Objects.requireNonNull(userId);

    return roundRepository.findByUserIdAndStatus(
      userId,
      RouletteRound.PENDING
    );
  }

  /**
   * Вызывается серверным заданием.
   *
   * Возвращает true, если раунд был завершён этим вызовом.
   * Повторная обработка завершённого раунда ничего не меняет.
   */
  @Transactional
  public boolean settleDueRound(UUID roundId) {
    Objects.requireNonNull(roundId);

    Optional<UUID> ownerId = roundRepository
      .findOwnerIdById(roundId);

    if (ownerId.isEmpty()) {
      return false;
    }

    // Общий порядок блокировок:
    // пользователь → раунд → счета → резерв.
    //
    // Статус ACTIVE здесь не проверяем:
    // принятая ранее ставка должна получить результат
    // даже после изменения статуса аккаунта.
    lockUser(ownerId.orElseThrow());

    RouletteRound round = roundRepository
      .findByIdForUpdate(roundId)
      .orElseThrow(() -> new IllegalStateException(
        "Раунд исчез во время расчёта"
      ));

    OffsetDateTime settledAt = now();

    if (!round.isDue(settledAt)) {
      return false;
    }

    WalletService.RouletteSettlement settlement =
      walletService.settleRoulette(
        round.getUserId(),
        round.getId(),
        round.getAccountId(),
        round.getHoldId(),
        round.getSecretResult(),
        settledAt
      );

    round.settle(
      settlement.transactionId(),
      settlement.balanceBeforeMinor(),
      settlement.balanceAfterMinor(),
      settledAt
    );

    if (RouletteRound.GREEN.equals(round.getOutcome())) {
      restrictionService.blockP2pForGreenRound(round);
    }

    // Принудительный flush позволяет обнаружить нарушения
    // ограничений БД до выхода из метода.
    roundRepository.flush();

    return true;
  }

  private User lockUser(UUID userId) {
    return userRepository
      .findByIdForUpdate(userId)
      .orElseThrow(() -> new ResponseStatusException(
        HttpStatus.NOT_FOUND,
        "Пользователь не найден"
      ));
  }

  private OffsetDateTime now() {
    // PostgreSQL хранит timestamp с точностью до микросекунд.
    return OffsetDateTime.now(clock)
      .truncatedTo(ChronoUnit.MICROS);
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
}
