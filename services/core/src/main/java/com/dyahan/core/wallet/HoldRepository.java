package com.dyahan.core.wallet;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface HoldRepository extends JpaRepository<Hold, UUID> {

  Optional<Hold> findByAccountIdAndReasonAndEntityId(
    UUID accountId,
    String reason,
    UUID entityId
  );

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select h from Hold h where h.id = :id")
  Optional<Hold> findByIdForUpdate(@Param("id") UUID id);
}
