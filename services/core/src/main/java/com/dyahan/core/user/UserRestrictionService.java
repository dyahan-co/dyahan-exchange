package com.dyahan.core.user;

import com.dyahan.core.roulette.RouletteRound;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserRestrictionService {

  private final UserRestrictionRepository restrictionRepository;

  public UserRestrictionService(
    UserRestrictionRepository restrictionRepository
  ) {
    this.restrictionRepository = restrictionRepository;
  }

  /**
   * Вызывается внутри общей транзакции расчёта рулетки.
   *
   * Если финансовый расчёт откатится,
   * блокировка также не будет сохранена.
   */
  @Transactional(propagation = Propagation.MANDATORY)
  public void blockP2pForGreenRound(RouletteRound round) {
    Objects.requireNonNull(round, "Не указан раунд");

    if (!RouletteRound.SETTLED.equals(round.getStatus())) {
      throw new IllegalStateException(
        "Нельзя устанавливать блокировку "
          + "для незавершённого раунда"
      );
    }

    if (!RouletteRound.GREEN.equals(round.getOutcome())) {
      throw new IllegalStateException(
        "Блокировка P2P предусмотрена "
          + "только для зелёной семёрки"
      );
    }

    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

    OffsetDateTime blockedUntil = round.getRevealAt()
      .plusHours(24);

    restrictionRepository.extendP2pBlock(
      round.getUserId(),
      round.getId(),
      blockedUntil,
      now
    );
  }

  @Transactional(readOnly = true)
  public Optional<OffsetDateTime> findP2pBlockedUntil(UUID userId) {
    Objects.requireNonNull(userId, "Не указан пользователь");

    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

    return restrictionRepository
      .findByUserIdAndRestrictionTypeAndBlockedUntilAfter(
        userId,
        UserRestriction.P2P_BLOCK,
        now
      )
      .map(UserRestriction::getBlockedUntil);
  }
}
