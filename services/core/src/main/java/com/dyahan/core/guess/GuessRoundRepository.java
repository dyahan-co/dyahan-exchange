package com.dyahan.core.guess;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface GuessRoundRepository extends JpaRepository<GuessRound, UUID> {
    boolean existsByUserIdAndStatus(UUID userId, GuessRoundStatus status);

    Optional<GuessRound> findByIdAndUserId(UUID id, UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select round from GuessRound round where round.id = :roundId")
    Optional<GuessRound> findByIdForUpdate(@Param("roundId") UUID roundId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select round
            from GuessRound round
            where round.userId = :userId
              and round.status = :status
            """)
    Optional<GuessRound> findByUserIdAndStatusForUpdate(
            @Param("userId") UUID userId,
            @Param("status") GuessRoundStatus status
    );
}
