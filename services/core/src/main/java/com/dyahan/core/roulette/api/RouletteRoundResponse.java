package com.dyahan.core.roulette.api;

import com.dyahan.core.roulette.RouletteRound;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RouletteRoundResponse(
  UUID id,
  String status,
  String currency,
  String stakeMinor,
  int rulesVersion,
  String commitment,
  OffsetDateTime createdAt,
  OffsetDateTime revealAt,
  Result result
) {

  public static RouletteRoundResponse from(RouletteRound round) {
    Result result = null;

    if (RouletteRound.SETTLED.equals(round.getStatus())) {
      result = new Result(
        round.getSecretResult(),
        round.getNonce(),
        round.getOutcome(),
        Long.toString(round.getDeltaMinor()),
        Long.toString(round.getBalanceBeforeMinor()),
        Long.toString(round.getBalanceAfterMinor()),
        round.getSettlementTransactionId(),
        round.getSettledAt()
      );
    }

    return new RouletteRoundResponse(
      round.getId(),
      round.getStatus(),
      round.getCurrency(),
      Long.toString(round.getStakeMinor()),
      round.getRulesVersion(),
      round.getCommitHash(),
      round.getCreatedAt(),
      round.getRevealAt(),
      result
    );
  }

  public record Result(
    int number,
    String nonce,
    String outcome,
    String deltaMinor,
    String balanceBeforeMinor,
    String balanceAfterMinor,
    UUID transactionId,
    OffsetDateTime settledAt
  ) {
  }
}
