package com.dyahan.core.wallet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "holds")
public class Hold {

  public static final String ACTIVE = "ACTIVE";
  public static final String CAPTURED = "CAPTURED";
  public static final String RELEASED = "RELEASED";

  public static final String ROULETTE_STAKE = "ROULETTE_STAKE";

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "account_id", nullable = false, updatable = false)
  private UUID accountId;

  @Column(name = "amount_minor", nullable = false, updatable = false)
  private long amountMinor;

  @Column(nullable = false, updatable = false, length = 40)
  private String reason;

  @Column(name = "entity_id", nullable = false, updatable = false)
  private UUID entityId;

  @Column(nullable = false, length = 20)
  private String status;

  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @Column(name = "expires_at", nullable = false, updatable = false)
  private OffsetDateTime expiresAt;

  @Column(name = "closed_at")
  private OffsetDateTime closedAt;

  protected Hold() {
    // Для JPA.
  }

  public Hold(
    UUID id,
    UUID accountId,
    long amountMinor,
    String reason,
    UUID entityId,
    OffsetDateTime createdAt,
    OffsetDateTime expiresAt
  ) {
    Objects.requireNonNull(id, "Не указан ID резерва");
    Objects.requireNonNull(accountId, "Не указан счёт");
    Objects.requireNonNull(entityId, "Не указан ID операции");
    Objects.requireNonNull(createdAt, "Не указано время создания");
    Objects.requireNonNull(expiresAt, "Не указан срок резерва");

    if (amountMinor <= 0) {
      throw new IllegalArgumentException(
        "Размер резерва должен быть положительным"
      );
    }

    if (reason == null || reason.isBlank() || reason.length() > 40) {
      throw new IllegalArgumentException(
        "Причина резерва должна содержать от 1 до 40 символов"
      );
    }

    if (!expiresAt.isAfter(createdAt)) {
      throw new IllegalArgumentException(
        "Срок резерва должен быть позже времени создания"
      );
    }

    this.id = id;
    this.accountId = accountId;
    this.amountMinor = amountMinor;
    this.reason = reason;
    this.entityId = entityId;
    this.status = ACTIVE;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }

  public void capture(OffsetDateTime now) {
    close(CAPTURED, now);
  }

  public void release(OffsetDateTime now) {
    close(RELEASED, now);
  }

  private void close(String targetStatus, OffsetDateTime now) {
    Objects.requireNonNull(now, "Не указано время закрытия");

    if (!isActive()) {
      throw new IllegalStateException("Резерв уже закрыт");
    }

    if (now.isBefore(createdAt)) {
      throw new IllegalArgumentException(
        "Время закрытия не может быть раньше создания"
      );
    }

    this.status = targetStatus;
    this.closedAt = now;
  }

  public boolean isActive() {
    return ACTIVE.equals(status);
  }

  public UUID getId() {
    return id;
  }

  public UUID getAccountId() {
    return accountId;
  }

  public long getAmountMinor() {
    return amountMinor;
  }

  public String getReason() {
    return reason;
  }

  public UUID getEntityId() {
    return entityId;
  }

  public String getStatus() {
    return status;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getExpiresAt() {
    return expiresAt;
  }

  public OffsetDateTime getClosedAt() {
    return closedAt;
  }
}
