package com.dyahan.core.wallet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "accounts")
public class Account {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "owner_id")
  private UUID ownerId;

  @Column(name = "account_type", nullable = false, length = 10)
  private String accountType;

  @Column(name = "system_code", length = 40)
  private String systemCode;

  @Column(nullable = false, length = 10)
  private String currency;

  @Column(name = "balance_minor", nullable = false)
  private long balanceMinor;

  @Column(name = "held_minor", nullable = false)
  private long heldMinor;

  @Version
  @Column(nullable = false)
  private long version;

  protected Account() {
    // Для JPA.
  }

  public Account(UUID id, UUID ownerId, String currency) {
    this.id = Objects.requireNonNull(id);
    this.ownerId = Objects.requireNonNull(ownerId);
    this.currency = Objects.requireNonNull(currency);
    this.accountType = "USER";
  }

  public long getAvailableMinor() {
    return Math.subtractExact(balanceMinor, heldMinor);
  }

  public void applyDelta(long deltaMinor) {
    if (deltaMinor == 0) {
      throw new IllegalArgumentException(
        "Изменение баланса не может быть нулевым"
      );
    }

    long newBalance = Math.addExact(balanceMinor, deltaMinor);

    if (isUserAccount() && newBalance < heldMinor) {
      throw new IllegalStateException(
        "Списание нарушает обеспечение резервов"
      );
    }

    this.balanceMinor = newBalance;
  }

  public void reserve(long amountMinor) {
    requireUserAccount();
    requirePositive(amountMinor);

    if (getAvailableMinor() < amountMinor) {
      throw new InsufficientFundsException();
    }

    this.heldMinor = Math.addExact(heldMinor, amountMinor);
  }

  public void release(long amountMinor) {
    requireUserAccount();
    requirePositive(amountMinor);

    if (heldMinor < amountMinor) {
      throw new IllegalStateException(
        "Размер освобождения превышает резерв"
      );
    }

    this.heldMinor = Math.subtractExact(heldMinor, amountMinor);
  }

  public void capture(long amountMinor) {
    requireUserAccount();
    requirePositive(amountMinor);

    if (heldMinor < amountMinor) {
      throw new IllegalStateException(
        "Недостаточно зарезервированных средств"
      );
    }

    long newHeld = Math.subtractExact(heldMinor, amountMinor);
    long newBalance = Math.subtractExact(balanceMinor, amountMinor);

    if (newBalance < newHeld) {
      throw new IllegalStateException(
        "Списание нарушает обеспечение других резервов"
      );
    }

    this.heldMinor = newHeld;
    this.balanceMinor = newBalance;
  }

  private boolean isUserAccount() {
    return "USER".equals(accountType);
  }

  private void requireUserAccount() {
    if (!isUserAccount()) {
      throw new IllegalStateException(
        "Системный счёт не поддерживает резервы"
      );
    }
  }

  private static void requirePositive(long amountMinor) {
    if (amountMinor <= 0) {
      throw new IllegalArgumentException(
        "Сумма должна быть положительной"
      );
    }
  }

  public UUID getId() {
    return id;
  }

  public UUID getOwnerId() {
    return ownerId;
  }

  public String getAccountType() {
    return accountType;
  }

  public String getSystemCode() {
    return systemCode;
  }

  public String getCurrency() {
    return currency;
  }

  public long getBalanceMinor() {
    return balanceMinor;
  }

  public long getHeldMinor() {
    return heldMinor;
  }

  public long getVersion() {
    return version;
  }
}
