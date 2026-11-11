package com.dyahan.core.roulette;

import com.dyahan.core.user.UserRegistrationService;
import com.dyahan.core.user.UserRestrictionService;
import com.dyahan.core.user.api.RegisterRequest;
import com.dyahan.core.wallet.Account;
import com.dyahan.core.wallet.AccountRepository;
import com.dyahan.core.wallet.Hold;
import com.dyahan.core.wallet.HoldRepository;
import com.dyahan.core.wallet.Posting;
import com.dyahan.core.wallet.PostingRepository;
import com.dyahan.core.wallet.WalletService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
  "spring.datasource.url=${TEST_DB_URL:jdbc:postgresql://localhost:5433/dyahan_test}"
})
class RouletteIntegrationTest {

  @Autowired
  private RouletteService rouletteService;

  @Autowired
  private WalletService walletService;

  @Autowired
  private UserRegistrationService registrationService;

  @Autowired
  private RouletteRoundRepository roundRepository;

  @Autowired
  private AccountRepository accountRepository;

  @Autowired
  private HoldRepository holdRepository;

  @Autowired
  private PostingRepository postingRepository;

  @Autowired
  private UserRestrictionService restrictionService;

  @Autowired
  private TransactionTemplate transactionTemplate;

  @MockitoBean(name = "rouletteClock")
  private Clock clock;

  @MockitoBean(name = "rouletteRandom")
  private SecureRandom random;

  // В тестах запускаем расчёт явно.
  // Фоновое задание не должно вмешиваться в проверки.
  @MockitoBean
  private RouletteScheduler scheduler;

  private AtomicReference<Instant> time;
  private UUID userId;

  @BeforeEach
  void prepare() {
    time = new AtomicReference<>(Instant.now());

    when(clock.getZone()).thenReturn(ZoneOffset.UTC);
    when(clock.instant()).thenAnswer(
      invocation -> time.get()
    );

    // По умолчанию результат — 1.
    when(random.nextInt(anyInt())).thenReturn(0);

    doAnswer(invocation -> {
      byte[] bytes = invocation.getArgument(0);

      for (int index = 0; index < bytes.length; index++) {
        bytes[index] = (byte) (index + 1);
      }

      return null;
    }).when(random).nextBytes(any(byte[].class));

    String nickname = "rt_" + UUID.randomUUID()
      .toString()
      .replace("-", "")
      .substring(0, 18);

    userId = registrationService.register(
      new RegisterRequest(
        nickname,
        "IntegrationTestPassword123",
        true
      )
    ).userId();
  }

  private void setResult(int number) {
    when(random.nextInt(10)).thenReturn(number - 1);
  }

  private RouletteRound start(int number) {
    setResult(number);

    return rouletteService.createRound(
      userId,
      UUID.randomUUID()
    );
  }

  private void advanceToReveal(RouletteRound round) {
    time.set(
      round.getRevealAt()
        .toInstant()
        .plusMillis(1)
    );
  }

  private RouletteRound finish(RouletteRound round) {
    advanceToReveal(round);

    assertTrue(
      rouletteService.settleDueRound(round.getId())
    );

    return rouletteService.getRound(
      userId,
      round.getId()
    );
  }

  private void assertWallet(
    long balance,
    long available,
    long held
  ) {
    WalletService.WalletSnapshot snapshot =
      walletService.getKumSnapshot(userId);

    assertEquals(balance, snapshot.balanceMinor());
    assertEquals(available, snapshot.availableMinor());
    assertEquals(held, snapshot.heldMinor());
  }

  private void assertBalancedPostings(RouletteRound round) {
    List<Posting> postings = postingRepository
      .findAllByTransaction_IdOrderByCreatedAtAscIdAsc(
        round.getSettlementTransactionId()
      );

    assertEquals(2, postings.size());

    assertTrue(
      postings.stream().allMatch(
        posting -> "KUM".equals(posting.getCurrency())
      )
    );

    assertEquals(
      0L,
      postings.stream()
        .mapToLong(Posting::getDeltaMinor)
        .sum()
    );
  }

  @Test
  void reservesStakeWithoutSpendingBalance() {
    RouletteRound round = start(1);

    assertEquals(RouletteRound.PENDING, round.getStatus());

    assertWallet(100, 98, 2);

    Hold hold = holdRepository
      .findById(round.getHoldId())
      .orElseThrow();

    assertEquals(Hold.ACTIVE, hold.getStatus());
    assertEquals(2L, hold.getAmountMinor());
    assertEquals(round.getId(), hold.getEntityId());
    assertEquals(round.getAccountId(), hold.getAccountId());
  }

  @Test
  void doesNotSettleBeforeDeadline() {
    RouletteRound round = start(1);

    assertFalse(
      rouletteService.settleDueRound(round.getId())
    );

    assertEquals(
      RouletteRound.PENDING,
      rouletteService.getRound(
        userId,
        round.getId()
      ).getStatus()
    );

    assertWallet(100, 98, 2);
  }

  @ParameterizedTest
  @ValueSource(ints = {1, 2, 3, 4, 5})
  void winningNumbersAddTwoKum(int number) {
    RouletteRound settled = finish(start(number));

    assertEquals(RouletteRound.SETTLED, settled.getStatus());
    assertEquals(RouletteRound.WIN, settled.getOutcome());
    assertEquals(2L, settled.getDeltaMinor().longValue());

    assertWallet(102, 102, 0);
    assertBalancedPostings(settled);

    assertEquals(
      Hold.RELEASED,
      holdRepository.findById(settled.getHoldId())
        .orElseThrow()
        .getStatus()
    );
  }

  @ParameterizedTest
  @ValueSource(ints = {6, 8, 9, 10})
  void losingNumbersSpendTwoKum(int number) {
    RouletteRound settled = finish(start(number));

    assertEquals(RouletteRound.LOSS, settled.getOutcome());
    assertEquals(-2L, settled.getDeltaMinor().longValue());

    assertWallet(98, 98, 0);
    assertBalancedPostings(settled);

    assertEquals(
      Hold.CAPTURED,
      holdRepository.findById(settled.getHoldId())
        .orElseThrow()
        .getStatus()
    );
  }

  @Test
  void greenNumberSpendsOneHundredAndBlocksP2p() {
    RouletteRound settled = finish(start(7));

    assertEquals(RouletteRound.GREEN, settled.getOutcome());
    assertEquals(-100L, settled.getDeltaMinor().longValue());

    assertWallet(0, 0, 0);
    assertBalancedPostings(settled);

    OffsetDateTime blockedUntil = restrictionService
      .findP2pBlockedUntil(userId)
      .orElseThrow();

    assertEquals(
      settled.getRevealAt().plusHours(24).toInstant(),
      blockedUntil.toInstant()
    );
  }

  @Test
  void greenNumberDoesNotMakeSmallBalanceNegative() {
    finish(start(6));
    assertWallet(98, 98, 0);

    RouletteRound settled = finish(start(7));

    assertEquals(-98L, settled.getDeltaMinor().longValue());
    assertWallet(0, 0, 0);
    assertBalancedPostings(settled);
  }

  @Test
  void greenNumberDoesNotSpendAnotherOperationsReserve() {
    transactionTemplate.executeWithoutResult(status -> {
      Account account = accountRepository
        .findUserAccountForUpdate(userId, "KUM")
        .orElseThrow();

      account.reserve(80);

      OffsetDateTime createdAt = OffsetDateTime.now(
        ZoneOffset.UTC
      );

      holdRepository.saveAndFlush(
        new Hold(
          UUID.randomUUID(),
          account.getId(),
          80,
          "P2P_ORDER",
          UUID.randomUUID(),
          createdAt,
          createdAt.plusHours(24)
        )
      );
    });

    assertWallet(100, 20, 80);

    RouletteRound settled = finish(start(7));

    assertEquals(-20L, settled.getDeltaMinor().longValue());

    // 80 КУМ продолжают обеспечивать P2P-резерв.
    assertWallet(80, 0, 80);
    assertBalancedPostings(settled);
  }

  @Test
  void repeatedStartReturnsSameRoundBeforeAndAfterSettlement() {
    UUID key = UUID.randomUUID();

    RouletteRound first = rouletteService.createRound(
      userId,
      key
    );

    RouletteRound repeated = rouletteService.createRound(
      userId,
      key
    );

    assertEquals(first.getId(), repeated.getId());
    assertWallet(100, 98, 2);

    finish(first);

    RouletteRound afterSettlement =
      rouletteService.createRound(userId, key);

    assertEquals(first.getId(), afterSettlement.getId());
    assertEquals(
      RouletteRound.SETTLED,
      afterSettlement.getStatus()
    );

    assertWallet(102, 102, 0);
  }

  @Test
  void repeatedSettlementDoesNotPayTwice() {
    RouletteRound settled = finish(start(1));

    assertFalse(
      rouletteService.settleDueRound(settled.getId())
    );

    assertWallet(102, 102, 0);
    assertBalancedPostings(settled);
  }

  @Test
  void rejectsSecondPendingRound() {
    start(1);

    ResponseStatusException error = assertThrows(
      ResponseStatusException.class,
      () -> rouletteService.createRound(
        userId,
        UUID.randomUUID()
      )
    );

    assertEquals(409, error.getStatusCode().value());
    assertWallet(100, 98, 2);
  }

  @Test
  void rejectsStakeWithoutAvailableMoney() {
    finish(start(7));
    assertWallet(0, 0, 0);

    assertThrows(
      IllegalStateException.class,
      () -> rouletteService.createRound(
        userId,
        UUID.randomUUID()
      )
    );

    assertTrue(
      rouletteService.findPendingRound(userId).isEmpty()
    );

    assertWallet(0, 0, 0);
  }

  @Test
  void doesNotExposeAnotherUsersRound() {
    RouletteRound round = start(1);

    ResponseStatusException error = assertThrows(
      ResponseStatusException.class,
      () -> rouletteService.getRound(
        UUID.randomUUID(),
        round.getId()
      )
    );

    assertEquals(404, error.getStatusCode().value());
  }

  @Test
  void concurrentStartsAcceptOnlyOneStake() throws Exception {
    List<Boolean> results = runConcurrently(
      () -> {
        try {
          rouletteService.createRound(
            userId,
            UUID.randomUUID()
          );
          return true;
        } catch (ResponseStatusException error) {
          assertEquals(
            409,
            error.getStatusCode().value()
          );
          return false;
        }
      }
    );

    assertEquals(
      1L,
      results.stream().filter(Boolean::booleanValue).count()
    );

    assertWallet(100, 98, 2);
  }

  @Test
  void concurrentSettlementsPayOnlyOnce() throws Exception {
    RouletteRound round = start(1);
    advanceToReveal(round);

    List<Boolean> results = runConcurrently(
      () -> rouletteService.settleDueRound(round.getId())
    );

    assertEquals(
      1L,
      results.stream().filter(Boolean::booleanValue).count()
    );

    assertWallet(102, 102, 0);

    assertBalancedPostings(
      rouletteService.getRound(userId, round.getId())
    );
  }

  private <T> List<T> runConcurrently(Callable<T> operation)
    throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(2);
    CountDownLatch ready = new CountDownLatch(2);
    CountDownLatch start = new CountDownLatch(1);

    Callable<T> task = () -> {
      ready.countDown();

      if (!start.await(10, TimeUnit.SECONDS)) {
        throw new IllegalStateException(
          "Не удалось синхронизировать потоки"
        );
      }

      return operation.call();
    };

    try {
      Future<T> first = executor.submit(task);
      Future<T> second = executor.submit(task);

      assertTrue(ready.await(10, TimeUnit.SECONDS));
      start.countDown();

      return List.of(
        first.get(20, TimeUnit.SECONDS),
        second.get(20, TimeUnit.SECONDS)
      );
    } finally {
      start.countDown();
      executor.shutdownNow();
      executor.awaitTermination(5, TimeUnit.SECONDS);
    }
  }
}
