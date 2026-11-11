package com.dyahan.core.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class OutboxPublisherScheduler {
    private static final Logger logger =
            LoggerFactory.getLogger(OutboxPublisherScheduler.class);

    private final OutboxPublisher outboxPublisher;

    public OutboxPublisherScheduler(OutboxPublisher outboxPublisher) {
        this.outboxPublisher = outboxPublisher;
    }

    @Scheduled(fixedDelayString = "${outbox.publisher.fixed-delay-ms:5000}")
    public void publishPendingEvents() {
        try {
            int publishedCount = outboxPublisher.publishBatch();

            if (publishedCount > 0) {
                logger.info("Опубликовано outbox-событий: {}", publishedCount);
            }
        } catch (RuntimeException exception) {
            logger.error("Не удалось обработать outbox-события", exception);
        }
    }
}