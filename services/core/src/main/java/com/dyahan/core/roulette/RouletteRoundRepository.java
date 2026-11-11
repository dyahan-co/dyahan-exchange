package com.dyahan.core.roulette;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RouletteRoundRepository
  extends JpaRepository<RouletteRound, UUID> {

  Optional<RouletteRound> findByUserIdAndIdempotencyKey(
    UUID userId,
    String idempotencyKey
  );

  Optional<RouletteRound> findByUserIdAndStatus(
    UUID userId,
    String status
  );

  Optional<RouletteRound> findByIdAndUserId(
    UUID id,
    UUID userId
  );

  @Query("""
            select r.userId
            from RouletteRound r
            where r.id = :id
            """)
  Optional<UUID> findOwnerIdById(@Param("id") UUID id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("""
            select r
            from RouletteRound r
            where r.id = :id
            """)
  Optional<RouletteRound> findByIdForUpdate(
    @Param("id") UUID id
  );

  @Query("""
            select r.id
            from RouletteRound r
            where r.status = 'PENDING'
              and r.revealAt <= :now
            order by r.revealAt, r.id
            """)
  List<UUID> findDueRoundIds(
    @Param("now") OffsetDateTime now,
    Pageable pageable
  );
}
