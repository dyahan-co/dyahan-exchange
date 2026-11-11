package com.dyahan.core.wallet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

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

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @Column(name = "balance_minor", nullable = false)
    private long balanceMinor;

    @Column(name = "held_minor", nullable = false)
    private long heldMinor;

    @Version
    @Column(name = "version", nullable = false)
    private long version;

    protected Account() {
        // Нужен JPA.
    }

    public Account(UUID id, UUID ownerId, String currency) {
        this.id = id;
        this.ownerId = ownerId;
        this.accountType = "USER";
        this.currency = currency;
    }

    public void applyDelta(long deltaMinor) {
        if (deltaMinor == 0) {
            throw new IllegalArgumentException("Изменение баланса не может быть нулевым");
        }

        long newBalance = Math.addExact(balanceMinor, deltaMinor);

        if ("USER".equals(accountType) && newBalance < 0) {
            throw new IllegalStateException("Баланс пользовательского счёта не может быть отрицательным");
        }

        this.balanceMinor = newBalance;
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