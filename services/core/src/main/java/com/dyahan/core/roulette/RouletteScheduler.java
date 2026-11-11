package com.dyahan.core.roulette;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Component
public class RouletteScheduler {

  private static final Logger log =
    LoggerFactory.getLogger(RouletteScheduler.class);

  private static final int BATCH_SIZE = 100;

  private final RouletteRoundRepository roundRepository;
  private final RouletteService rouletteService;
  private final Clock clock;

  public RouletteScheduler(
    RouletteRoundRepository roundRepository,
    RouletteService rouletteService,
    @Qualifier("rouletteClock") Clock clock
  ) {
    this.roundRepository = roundRepository;
    this.rouletteService = rouletteService;
    this.clock = clock;
  }

  @Scheduled(
    fixedDelayString = "${roulette.settlement-delay-ms:1000}"
  )
  public void settleDueRounds() {
    List<UUID> roundIds;

    try {
      roundIds = roundRepository.findDueRoundIds(
        OffsetDateTime.now(clock),
        PageRequest.of(0, BATCH_SIZE)
      );
    } catch (RuntimeException exception) {
      log.error(
        "Не удалось получить раунды для расчёта",
        exception
      );
      return;
    }

    for (UUID roundId : roundIds) {
      try {
        rouletteService.settleDueRound(roundId);
      } catch (RuntimeException exception) {
        // Неудачный раунд остаётся PENDING.
        // Следующий проход повторит попытку.
        log.error(
          "Не удалось завершить раунд {}",
          roundId,
          exception
        );
      }
    }
  }
}
