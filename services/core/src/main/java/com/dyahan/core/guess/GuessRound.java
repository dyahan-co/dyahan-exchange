package com.dyahan.core.guess;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "guess_rounds")
public class GuessRound {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "question_id", nullable = false, updatable = false)
    private UUID questionId;

    @Column(name = "rules_version", nullable = false, length = 40, updatable = false)
    private String rulesVersion;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private OffsetDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private GuessRoundStatus status;

    @Column
    private Short score;

    @Column(name = "transaction_id", unique = true)
    private UUID transactionId;

    @Column(name = "submission_hash", length = 64)
    private String submissionHash;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected GuessRound() {
        // Нужен JPA.
    }

    public GuessRound(
            UUID id,
            UUID userId,
            UUID questionId,
            String rulesVersion,
            OffsetDateTime expiresAt
    ) {
        this.id = id;
        this.userId = userId;
        this.questionId = questionId;
        this.rulesVersion = rulesVersion;
        this.expiresAt = expiresAt;
        this.status = GuessRoundStatus.OPEN;
    }

    public void markWon(
            UUID transactionId,
            String submissionHash,
            OffsetDateTime closedAt
    ) {
        ensureOpen();
        validateSubmissionHash(submissionHash);

        if (transactionId == null) {
            throw new IllegalArgumentException(
                    "Для выигранного раунда нужна ledger-транзакция"
            );
        }

        this.status = GuessRoundStatus.WON;
        this.score = 1;
        this.transactionId = transactionId;
        this.submissionHash = submissionHash;
        this.closedAt = closedAt;
    }

    public void markLost(String submissionHash, OffsetDateTime closedAt) {
        ensureOpen();
        validateSubmissionHash(submissionHash);

        this.status = GuessRoundStatus.LOST;
        this.score = 0;
        this.submissionHash = submissionHash;
        this.closedAt = closedAt;
    }

    public void markExpired(OffsetDateTime closedAt) {
        ensureOpen();

        this.status = GuessRoundStatus.EXPIRED;
        this.score = 0;
        this.closedAt = closedAt;
    }

    private void ensureOpen() {
        if (status != GuessRoundStatus.OPEN) {
            throw new IllegalStateException("Раунд уже закрыт");
        }
    }

    private void validateSubmissionHash(String value) {
        if (value == null || !value.matches("[0-9a-f]{64}")) {
            throw new IllegalArgumentException(
                    "Хеш ответа должен быть SHA-256 в hex-формате"
            );
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getQuestionId() {
        return questionId;
    }

    public String getRulesVersion() {
        return rulesVersion;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public GuessRoundStatus getStatus() {
        return status;
    }

    public Short getScore() {
        return score;
    }

    public UUID getTransactionId() {
        return transactionId;
    }

    public String getSubmissionHash() {
        return submissionHash;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getClosedAt() {
        return closedAt;
    }

    public long getVersion() {
        return version;
    }
}