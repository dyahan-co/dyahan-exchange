package com.dyahan.core.wallet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "journal_transactions")
public class JournalTransaction {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "operation_type", nullable = false, length = 40)
    private String operationType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "idempotency_key", nullable = false, length = 120)
    private String idempotencyKey;

    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected JournalTransaction() {
        // Нужен JPA.
    }

    public JournalTransaction(
            UUID id,
            UUID actorId,
            String operationType,
            UUID entityId,
            String idempotencyKey,
            String requestHash
    ) {
        this.id = id;
        this.actorId = actorId;
        this.operationType = operationType;
        this.entityId = entityId;
        this.idempotencyKey = idempotencyKey;
        this.requestHash = requestHash;
    }

    public UUID getId() {
        return id;
    }

    public UUID getActorId() {
        return actorId;
    }

    public String getOperationType() {
        return operationType;
    }

    public UUID getEntityId() {
        return entityId;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public String getRequestHash() {
        return requestHash;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}