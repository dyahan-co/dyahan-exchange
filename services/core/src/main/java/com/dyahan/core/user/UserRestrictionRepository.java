package com.dyahan.core.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface UserRestrictionRepository
  extends JpaRepository<
  UserRestriction,
  UserRestriction.Key
  > {

  Optional<UserRestriction>
  findByUserIdAndRestrictionTypeAndBlockedUntilAfter(
    UUID userId,
    String restrictionType,
    OffsetDateTime now
  );

  @Modifying(flushAutomatically = true)
  @Query(
    value = """
                    INSERT INTO user_restrictions (
                        user_id,
                        restriction_type,
                        blocked_until,
                        reason,
                        source_roulette_round_id,
                        updated_at
                    )
                    VALUES (
                        :userId,
                        'P2P_BLOCK',
                        :blockedUntil,
                        'ROULETTE_GREEN',
                        :roundId,
                        :updatedAt
                    )
                    ON CONFLICT (user_id, restriction_type)
                    DO UPDATE SET
                        blocked_until = EXCLUDED.blocked_until,
                        reason = EXCLUDED.reason,
                        source_roulette_round_id =
                            EXCLUDED.source_roulette_round_id,
                        updated_at = EXCLUDED.updated_at
                    WHERE EXCLUDED.blocked_until >
                        user_restrictions.blocked_until
                    """,
    nativeQuery = true
  )
  int extendP2pBlock(
    @Param("userId") UUID userId,
    @Param("roundId") UUID roundId,
    @Param("blockedUntil") OffsetDateTime blockedUntil,
    @Param("updatedAt") OffsetDateTime updatedAt
  );
}
