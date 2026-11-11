package com.dyahan.core.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "user_restrictions")
@IdClass(UserRestriction.Key.class)
public class UserRestriction {

  public static final String P2P_BLOCK = "P2P_BLOCK";
  public static final String ROULETTE_GREEN = "ROULETTE_GREEN";

  @Id
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Id
  @Column(
    name = "restriction_type",
    nullable = false,
    length = 40
  )
  private String restrictionType;

  @Column(name = "blocked_until", nullable = false)
  private OffsetDateTime blockedUntil;

  @Column(nullable = false, length = 80)
  private String reason;

  @Column(name = "source_roulette_round_id", nullable = false)
  private UUID sourceRouletteRoundId;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected UserRestriction() {
    // Для JPA.
  }

  public UUID getUserId() {
    return userId;
  }

  public String getRestrictionType() {
    return restrictionType;
  }

  public OffsetDateTime getBlockedUntil() {
    return blockedUntil;
  }

  public String getReason() {
    return reason;
  }

  public UUID getSourceRouletteRoundId() {
    return sourceRouletteRoundId;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public static class Key implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID userId;
    private String restrictionType;

    public Key() {
      // Для JPA.
    }

    public Key(UUID userId, String restrictionType) {
      this.userId = userId;
      this.restrictionType = restrictionType;
    }

    public UUID getUserId() {
      return userId;
    }

    public String getRestrictionType() {
      return restrictionType;
    }

    @Override
    public boolean equals(Object object) {
      if (this == object) {
        return true;
      }

      if (!(object instanceof Key other)) {
        return false;
      }

      return Objects.equals(userId, other.userId)
        && Objects.equals(
        restrictionType,
        other.restrictionType
      );
    }

    @Override
    public int hashCode() {
      return Objects.hash(userId, restrictionType);
    }
  }
}
