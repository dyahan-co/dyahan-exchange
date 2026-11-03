package com.dyahan.core.wallet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface JournalTransactionRepository
        extends JpaRepository<JournalTransaction, UUID> {

    Optional<JournalTransaction> findByActorIdAndOperationTypeAndIdempotencyKey(
            UUID actorId,
            String operationType,
            String idempotencyKey
    );
}