package com.dyahan.core.guess;

import com.dyahan.core.outbox.OutboxEvent;
import com.dyahan.core.outbox.OutboxEventRepository;
import com.dyahan.core.user.UserRepository;
import com.dyahan.core.wallet.WalletService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GuessGameService {
    private final GuessQuestionRepository questionRepository;
    private final GuessRoundRepository roundRepository;
    private final GuessAnswerRulesRegistry rulesRegistry;
    private final WalletService walletService;
    private final OutboxEventRepository outboxEventRepository;
    private final Duration roundDuration;
    private final UserRepository userRepository;
    private final Clock clock;

    public GuessGameService(
            GuessQuestionRepository questionRepository,
            GuessRoundRepository roundRepository,
            GuessAnswerRulesRegistry rulesRegistry,
            WalletService walletService,
            OutboxEventRepository outboxEventRepository,
            @Value("${game.guess.round-duration:PT2M}") Duration roundDuration,
            UserRepository userRepository,
            Clock clock
    ) {
        if (roundDuration.isZero() || roundDuration.isNegative()) {
            throw new IllegalArgumentException(
                    "Длительность раунда должна быть положительной"
            );
        }

        this.questionRepository = questionRepository;
        this.roundRepository = roundRepository;
        this.rulesRegistry = rulesRegistry;
        this.walletService = walletService;
        this.outboxEventRepository = outboxEventRepository;
        this.roundDuration = roundDuration;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /**
     * Начинает раунд или возвращает уже открытый раунд пользователя.
     */
    @Transactional
    public GuessRoundView startRound(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Для начала раунда нужен userId");
        }

        // Блокировка строки пользователя сериализует одновременный старт,
        // даже если открытого раунда ещё нет.
        userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Пользователь не найден"
                ));

        OffsetDateTime now = nowUtc();

        var existingRound = roundRepository.findByUserIdAndStatusForUpdate(
                userId,
                GuessRoundStatus.OPEN
        );

        if (existingRound.isPresent()) {
            GuessRound round = existingRound.orElseThrow();

            if (round.getExpiresAt().isAfter(now)) {
                return toView(round);
            }

            round.markExpired(now);
            roundRepository.flush();
        }

        List<GuessQuestion> activeQuestions =
                questionRepository.findAllByActiveTrue();

        if (activeQuestions.isEmpty()) {
            throw new IllegalStateException("Нет доступных вопросов для игры");
        }

        GuessQuestion question = activeQuestions.get(
                ThreadLocalRandom.current().nextInt(activeQuestions.size())
        );

        // Не создаём раунд с версией, для которой в Core нет реализации.
        rulesRegistry.require(question.getRulesVersion());

        GuessRound round = new GuessRound(
                UUID.randomUUID(),
                userId,
                question.getId(),
                question.getRulesVersion(),
                now.plus(roundDuration)
        );

        roundRepository.saveAndFlush(round);
        return toView(round, question);
    }

    /**
     * Закрывает раунд. При победе запись раунда, награда и outbox-событие
     * сохраняются в общей транзакции.
     */
    @Transactional
    public GuessSubmissionResult submitAnswer(
            UUID userId,
            UUID roundId,
            String answer
    ) {
        if (userId == null || roundId == null) {
            throw new IllegalArgumentException(
                    "Для ответа нужны userId и roundId"
            );
        }

        GuessRound round = roundRepository.findByIdForUpdate(roundId)
                .orElseThrow(GuessRoundNotFoundException::new);

        // Возвращаем одинаковую ошибку, чтобы не раскрывать чужие раунды.
        if (!userId.equals(round.getUserId())) {
            throw new GuessRoundNotFoundException();
        }

        if (round.getStatus() == GuessRoundStatus.EXPIRED) {
            return toSubmissionResult(round);
        }

        // Нормализация тоже выбирается по версии, сохранённой в раунде.
        GuessAnswerRules rules = rulesRegistry.require(round.getRulesVersion());
        String normalizedAnswer = rules.normalize(answer);
        String submissionHash = sha256(normalizedAnswer);

        if (round.getStatus() != GuessRoundStatus.OPEN) {
            if (submissionHash.equals(round.getSubmissionHash())) {
                return toSubmissionResult(round);
            }

            throw new GuessSubmissionConflictException();
        }

        OffsetDateTime now = nowUtc();

        if (!round.getExpiresAt().isAfter(now)) {
            round.markExpired(now);
            roundRepository.flush();
            return toSubmissionResult(round);
        }

        GuessQuestion question = questionRepository.findById(round.getQuestionId())
                .orElseThrow(() -> new IllegalStateException(
                        "Вопрос раунда не найден"
                ));

        if (!round.getRulesVersion().equals(question.getRulesVersion())) {
            throw new IllegalStateException(
                    "Версия правил вопроса не совпадает с версией раунда"
            );
        }

        if (rules.matches(normalizedAnswer, question)) {
            UUID transactionId = walletService.rewardGuess(userId, roundId);

            outboxEventRepository.saveAndFlush(
                    new OutboxEvent(
                            UUID.randomUUID(),
                            "GUESS_ROUND",
                            roundId,
                            "guess.rewarded.v1",
                            Map.of(
                                    "roundId", roundId,
                                    "userId", userId,
                                    "questionId", round.getQuestionId(),
                                    "transactionId", transactionId,
                                    "currency", "KUM",
                                    "amountMinor", 1
                            )
                    )
            );

            round.markWon(transactionId, submissionHash, now);
        } else {
            round.markLost(submissionHash, now);
        }

        roundRepository.flush();
        return toSubmissionResult(round);
    }

    private OffsetDateTime nowUtc() {
        return OffsetDateTime.now(clock)
                .withOffsetSameInstant(ZoneOffset.UTC);
    }

    private GuessRoundView toView(GuessRound round) {
        GuessQuestion question = questionRepository.findById(round.getQuestionId())
                .orElseThrow(() -> new IllegalStateException(
                        "Вопрос открытого раунда не найден"
                ));

        if (!round.getRulesVersion().equals(question.getRulesVersion())) {
            throw new IllegalStateException(
                    "Версия правил вопроса не совпадает с версией раунда"
            );
        }

        rulesRegistry.require(round.getRulesVersion());
        return toView(round, question);
    }

    private GuessRoundView toView(
            GuessRound round,
            GuessQuestion question
    ) {
        return new GuessRoundView(
                round.getId(),
                question.getImageObjectKey(),
                question.getHint(),
                round.getExpiresAt()
        );
    }

    private GuessSubmissionResult toSubmissionResult(GuessRound round) {
        short score = round.getScore() == null ? 0 : round.getScore();

        return new GuessSubmissionResult(
                round.getId(),
                round.getStatus(),
                score,
                round.getTransactionId(),
                round.getClosedAt()
        );
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 недоступен", exception);
        }
    }
}