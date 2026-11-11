package com.dyahan.core.roulette;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "roulette_rounds")
public class RouletteRound {

  public static final long STAKE = 2L;

  public static final String PENDING = "PENDING";
  public static final String SETTLED = "SETTLED";

  public static final String WIN = "WIN";
  public static final String LOSS = "LOSS";
  public static final String GREEN = "GREEN";

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "user_id", nullable = false, updatable = false)
  private UUID userId;

  @Column(name = "account_id", nullable = false, updatable = false)
  private UUID accountId;

  @Column(nullable = false, updatable = false, length = 10)
  private String currency;

  @Column(name = "stake_minor", nullable = false, updatable = false)
  private long stakeMinor;

  @Column(name = "hold_id", nullable = false, updatable = false)
  private UUID holdId;

  @Column(
    name = "idempotency_key",
    nullable = false,
    updatable = false,
    length = 120
  )
  private String idempotencyKey;

  @Column(
    name = "request_hash",
    nullable = false,
    updatable = false,
    length = 64
  )
  private String requestHash;

  @Column(name = "rules_version", nullable = false, updatable = false)
  private int rulesVersion;

  @Column(name = "secret_result", nullable = false, updatable = false)
  private short secretResult;

  @Column(nullable = false, updatable = false, length = 64)
  private String nonce;

  @Column(
    name = "commit_hash",
    nullable = false,
    updatable = false,
    length = 64
  )
  private String commitHash;

  @Column(nullable = false, length = 20)
  private String status;

  @Column(length = 20)
  private String outcome;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "reveal_at", nullable = false, updatable = false)
  private OffsetDateTime revealAt;

  @Column(name = "settled_at")
  private OffsetDateTime settledAt;

  @Column(name = "delta_minor")
  private Long deltaMinor;

  @Column(name = "balance_before_minor")
  private Long balanceBeforeMinor;

  @Column(name = "balance_after_minor")
  private Long balanceAfterMinor;

  @Column(name = "settlement_transaction_id")
  private UUID settlementTransactionId;

  protected RouletteRound() {
    // Для JPA.
  }

  public RouletteRound(
    UUID id,
    UUID userId,
    UUID accountId,
    UUID holdId,
    String idempotencyKey,
    String requestHash,
    int secretResult,
    String nonce,
    OffsetDateTime createdAt,
    OffsetDateTime revealAt
  ) {
    this.id = Objects.requireNonNull(id);
    this.userId = Objects.requireNonNull(userId);
    this.accountId = Objects.requireNonNull(accountId);
    this.holdId = Objects.requireNonNull(holdId);
    this.createdAt = Objects.requireNonNull(createdAt);
    this.revealAt = Objects.requireNonNull(revealAt);

    if (idempotencyKey == null
      || idempotencyKey.isBlank()
      || idempotencyKey.length() > 120) {
      throw new IllegalArgumentException(
        "Некорректный ключ идемпотентности"
      );
    }

    if (requestHash == null
      || !requestHash.matches("[0-9a-f]{64}")) {
      throw new IllegalArgumentException(
        "Некорректный хеш запроса"
      );
    }

    if (secretResult < 1 || secretResult > 10) {
      throw new IllegalArgumentException(
        "Результат должен быть от 1 до 10"
      );
    }

    if (nonce == null || !nonce.matches("[0-9a-f]{64}")) {
      throw new IllegalArgumentException(
        "Nonce должен содержать 32 случайных байта в hex"
      );
    }

    if (!revealAt.isAfter(createdAt)) {
      throw new IllegalArgumentException(
        "Срок раскрытия должен быть позже создания"
      );
    }

    this.currency = "KUM";
    this.stakeMinor = STAKE;
    this.idempotencyKey = idempotencyKey;
    this.requestHash = requestHash;
    this.rulesVersion = 1;
    this.secretResult = (short) secretResult;
    this.nonce = nonce;
    this.commitHash = sha256(
      id + "|" + secretResult + "|" + nonce
    );
    this.status = PENDING;
  }

  public boolean isPending() {
    return PENDING.equals(status);
  }

  public boolean isDue(OffsetDateTime now) {
    Objects.requireNonNull(now);
    return isPending() && !now.isBefore(revealAt);
  }

  public String determineOutcome() {
    if (secretResult == 7) {
      return GREEN;
    }

    return secretResult <= 5 ? WIN : LOSS;
  }

  /**
   * Фиксирует результат уже выполненного расчёта Wallet.
   * Метод должен вызываться в той же транзакции,
   * что и изменение счетов, резервов и проводок.
   */
  public void settle(
    UUID transactionId,
    long balanceBefore,
    long balanceAfter,
    OffsetDateTime now
  ) {
    Objects.requireNonNull(transactionId);
    Objects.requireNonNull(now);

    if (!isPending()) {
      throw new IllegalStateException(
        "Раунд уже завершён"
      );
    }

    if (now.isBefore(revealAt)) {
      throw new IllegalStateException(
        "Срок раскрытия ещё не наступил"
      );
    }

    if (balanceBefore < 0 || balanceAfter < 0) {
      throw new IllegalArgumentException(
        "Баланс не может быть отрицательным"
      );
    }

    long delta = Math.subtractExact(balanceAfter, balanceBefore);
    String result = determineOutcome();

    if (WIN.equals(result) && delta != STAKE) {
      throw new IllegalArgumentException(
        "Выигрыш должен составлять +2 КУМ"
      );
    }

    if (LOSS.equals(result) && delta != -STAKE) {
      throw new IllegalArgumentException(
        "Проигрыш должен составлять -2 КУМ"
      );
    }

    if (GREEN.equals(result) && (delta < -100 || delta > 0)) {
      throw new IllegalArgumentException(
        "Штраф семёрки должен быть от 0 до 100 КУМ"
      );
    }

    this.outcome = result;
    this.deltaMinor = delta;
    this.balanceBeforeMinor = balanceBefore;
    this.balanceAfterMinor = balanceAfter;
    this.settlementTransactionId = transactionId;
    this.settledAt = now;
    this.status = SETTLED;
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

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getAccountId() {
    return accountId;
  }

  public String getCurrency() {
    return currency;
  }

  public long getStakeMinor() {
    return stakeMinor;
  }

  public UUID getHoldId() {
    return holdId;
  }

  public String getIdempotencyKey() {
    return idempotencyKey;
  }

  public String getRequestHash() {
    return requestHash;
  }

  public int getRulesVersion() {
    return rulesVersion;
  }

  public short getSecretResult() {
    return secretResult;
  }

  public String getNonce() {
    return nonce;
  }

  public String getCommitHash() {
    return commitHash;
  }

  public String getStatus() {
    return status;
  }

  public String getOutcome() {
    return outcome;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getRevealAt() {
    return revealAt;
  }

  public OffsetDateTime getSettledAt() {
    return settledAt;
  }

  public Long getDeltaMinor() {
    return deltaMinor;
  }

  public Long getBalanceBeforeMinor() {
    return balanceBeforeMinor;
  }

  public Long getBalanceAfterMinor() {
    return balanceAfterMinor;
  }

  public UUID getSettlementTransactionId() {
    return settlementTransactionId;
  }
}
