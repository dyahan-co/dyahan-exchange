package com.dyahan.core.roulette.api;

import com.dyahan.core.roulette.RouletteRound;
import com.dyahan.core.roulette.RouletteService;
import com.dyahan.core.user.api.CurrentUserResolver;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roulette-rounds")
public class RouletteController {

  private final RouletteService rouletteService;
  private final CurrentUserResolver currentUserResolver;

  public RouletteController(
    RouletteService rouletteService,
    CurrentUserResolver currentUserResolver
  ) {
    this.rouletteService = rouletteService;
    this.currentUserResolver = currentUserResolver;
  }

  @PostMapping
  public ResponseEntity<RouletteRoundResponse> createRound(
    @RequestHeader(
      value = "Authorization",
      required = false
    )
    String authorization,

    @RequestHeader("Idempotency-Key")
    UUID idempotencyKey
  ) {
    UUID userId = currentUserResolver.requireUserId(
      authorization
    );

    RouletteRound round = rouletteService.createRound(
      userId,
      idempotencyKey
    );

    // 200 подходит и для новой команды,
    // и для повторного запроса того же раунда.
    return ResponseEntity.ok(
      RouletteRoundResponse.from(round)
    );
  }

  @GetMapping("/active")
  public ResponseEntity<RouletteRoundResponse> activeRound(
    @RequestHeader(
      value = "Authorization",
      required = false
    )
    String authorization
  ) {
    UUID userId = currentUserResolver.requireUserId(
      authorization
    );

    return rouletteService.findPendingRound(userId)
      .map(RouletteRoundResponse::from)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity
        .status(HttpStatus.NO_CONTENT)
        .build());
  }

  @GetMapping("/{roundId}")
  public RouletteRoundResponse getRound(
    @RequestHeader(
      value = "Authorization",
      required = false
    )
    String authorization,

    @PathVariable("roundId")
    UUID roundId
  ) {
    return readRound(authorization, roundId);
  }

  @GetMapping("/{roundId}/reveal")
  public RouletteRoundResponse reveal(
    @RequestHeader(
      value = "Authorization",
      required = false
    )
    String authorization,

    @PathVariable("roundId")
    UUID roundId
  ) {
    // Только чтение.
    // Финансовый расчёт выполняется scheduler-ом.
    return readRound(authorization, roundId);
  }

  private RouletteRoundResponse readRound(
    String authorization,
    UUID roundId
  ) {
    UUID userId = currentUserResolver.requireUserId(
      authorization
    );

    RouletteRound round = rouletteService.getRound(
      userId,
      roundId
    );

    return RouletteRoundResponse.from(round);
  }
}
