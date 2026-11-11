package com.dyahan.core.outbox;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.json.JsonWriter;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OutboxPublisher {
    private static final int BATCH_SIZE = 50;

    private static final JsonWriter<Map<String, Object>> JSON_WRITER =
            JsonWriter.standard();

    private final OutboxEventRepository outboxEventRepository;
    private final StringRedisTemplate redisTemplate;
    private final String channel;

    public OutboxPublisher(
            OutboxEventRepository outboxEventRepository,
            StringRedisTemplate redisTemplate,
            @Value("${outbox.redis.channel:dyahan:core:events}") String channel
    ) {
        this.outboxEventRepository = outboxEventRepository;
        this.redisTemplate = redisTemplate;
        this.channel = channel;
    }

    /**
     * Выбирает неопубликованные события с блокировкой строк,
     * публикует их в Redis Pub/Sub и отмечает успешные публикации.
     */
    @Transactional
    public int publishBatch() {
        List<OutboxEvent> events =
                outboxEventRepository.lockNextBatch(BATCH_SIZE);

        int publishedCount = 0;

        for (OutboxEvent event : events) {
            try {
                String message = serialize(event);
                Long subscriberCount = redisTemplate.convertAndSend(channel, message);

                if (subscriberCount == null || subscriberCount == 0) {
                    event.markFailed("В Redis Pub/Sub сейчас нет подписчиков");
                    continue;
                }

                event.markPublished(OffsetDateTime.now(ZoneOffset.UTC));
                publishedCount++;
            } catch (RuntimeException exception) {
                event.markFailed(exception.getMessage());
            }
        }

        return publishedCount;
    }

    private String serialize(OutboxEvent event) {
        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("eventId", event.getId().toString());
        envelope.put("eventVersion", 1);
        envelope.put("eventType", event.getEventType());
        envelope.put("aggregateType", event.getAggregateType());
        envelope.put("aggregateId", event.getAggregateId().toString());
        envelope.put("payload", toJsonMap(event.getPayload()));

        return JSON_WRITER.writeToString(envelope);
    }

    private Map<String, Object> toJsonMap(Map<String, Object> source) {
        Map<String, Object> result = new LinkedHashMap<>();

        source.forEach((key, value) ->
                result.put(key, toJsonValue(value))
        );

        return result;
    }

    private Object toJsonValue(Object value) {
        if (value == null
                || value instanceof String
                || value instanceof Number
                || value instanceof Boolean) {
            return value;
        }

        if (value instanceof UUID uuid) {
            return uuid.toString();
        }

        if (value instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();

            map.forEach((key, nestedValue) -> {
                if (!(key instanceof String stringKey)) {
                    throw new IllegalArgumentException(
                            "Ключи JSON-объекта должны быть строками"
                    );
                }
                result.put(stringKey, toJsonValue(nestedValue));
            });

            return result;
        }

        if (value instanceof Iterable<?> iterable) {
            List<Object> result = new ArrayList<>();
            iterable.forEach(item -> result.add(toJsonValue(item)));
            return result;
        }

        throw new IllegalArgumentException(
                "Неподдерживаемый тип значения outbox payload: "
                        + value.getClass().getName()
        );
    }
}