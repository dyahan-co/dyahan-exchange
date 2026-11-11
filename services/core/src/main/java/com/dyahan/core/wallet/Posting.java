package com.dyahan.core.wallet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "postings")
public class Posting {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transaction_id", nullable = false)
    private JournalTransaction transaction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @Column(name = "delta_minor", nullable = false)
    private long deltaMinor;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Posting() {
        // Нужен JPA.
    }

    public Posting(
            UUID id,
            JournalTransaction transaction,
            Account account,
            String currency,
            long deltaMinor
    ) {
        this.id = id;
        this.transaction = transaction;
        this.account = account;
        this.currency = currency;
        this.deltaMinor = deltaMinor;
    }

    public UUID getId() {
        return id;
    }

    public JournalTransaction getTransaction() {
        return transaction;
    }

    public Account getAccount() {
        return account;
    }

    public String getCurrency() {
        return currency;
    }

    public long getDeltaMinor() {
        return deltaMinor;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}