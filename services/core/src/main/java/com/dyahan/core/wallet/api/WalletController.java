package com.dyahan.core.wallet.api;

import com.dyahan.core.user.UserRestrictionService;
import com.dyahan.core.user.api.CurrentUserResolver;
import com.dyahan.core.wallet.WalletService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wallet")
public class WalletController {

  private final WalletService walletService;
  private final CurrentUserResolver currentUserResolver;
  private final UserRestrictionService restrictionService;

  public WalletController(
    WalletService walletService,
    CurrentUserResolver currentUserResolver,
    UserRestrictionService restrictionService
  ) {
    this.walletService = walletService;
    this.currentUserResolver = currentUserResolver;
    this.restrictionService = restrictionService;
  }

  @GetMapping
  public WalletResponse getWallet(
    @RequestHeader(
      value = "Authorization",
      required = false
    )
    String authorization
  ) {
    UUID userId = currentUserResolver.requireUserId(
      authorization
    );

    WalletService.WalletSnapshot snapshot =
      walletService.getKumSnapshot(userId);

    OffsetDateTime p2pBlockedUntil = restrictionService
      .findP2pBlockedUntil(userId)
      .orElse(null);

    return new WalletResponse(
      "KUM",
      Long.toString(snapshot.balanceMinor()),
      Long.toString(snapshot.availableMinor()),
      Long.toString(snapshot.heldMinor()),
      p2pBlockedUntil
    );
  }

  public record WalletResponse(
    String currency,
    String balanceMinor,
    String availableMinor,
    String heldMinor,
    OffsetDateTime p2pBlockedUntil
  ) {
  }
}
