package com.dyahan.core.outbox;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "aggregate_type", nullable = false, length = 40, updatable = false)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false, updatable = false)
    private UUID aggregateId;

    @Column(name = "event_type", nullable = false, length = 80, updatable = false)
    private String eventType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", nullable = false, columnDefinition = "jsonb", updatable = false)
    private Map<String, Object> payload;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "last_error")
    private String lastError;

    protected OutboxEvent() {
        // Нужен JPA.
    }

    public OutboxEvent(
            UUID id,
            String aggregateType,
            UUID aggregateId,
            String eventType,
            Map<String, Object> payload
    ) {
        if (id == null || aggregateId == null) {
            throw new IllegalArgumentException("Для outbox-события нужны id и aggregateId");
        }
        if (aggregateType == null || aggregateType.isBlank()) {
            throw new IllegalArgumentException("aggregateType не может быть пустым");
        }
        if (eventType == null || eventType.isBlank()) {
            throw new IllegalArgumentException("eventType не может быть пустым");
        }
        if (payload == null || payload.isEmpty()) {
            throw new IllegalArgumentException("payload не может быть пустым");
        }

        this.id = id;
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.payload = Map.copyOf(payload);
        this.attemptCount = 0;
    }

    public void markPublished(OffsetDateTime publishedAt) {
        if (publishedAt == null) {
            throw new IllegalArgumentException("Время публикации не может быть null");
        }
        if (this.publishedAt == null) {
            this.publishedAt = publishedAt;
            this.lastError = null;
        }
    }

    public void markFailed(String errorMessage) {
        this.attemptCount++;

        if (errorMessage == null || errorMessage.isBlank()) {
            this.lastError = "Неизвестная ошибка публикации";
            return;
        }

        this.lastError = errorMessage.length() <= 2000
                ? errorMessage
                : errorMessage.substring(0, 2000);
    }

    public UUID getId() {
        return id;
    }

    public String getAggregateType() {
        return aggregateType;
    }

    public UUID getAggregateId() {
        return aggregateId;
    }

    public String getEventType() {
        return eventType;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getPublishedAt() {
        return publishedAt;
    }

    public int getAttemptCount() {
        return attemptCount;
    }

    public String getLastError() {
        return lastError;
    }
}