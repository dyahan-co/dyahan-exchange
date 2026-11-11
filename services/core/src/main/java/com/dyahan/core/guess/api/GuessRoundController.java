package com.dyahan.core.guess.api;

import com.dyahan.core.guess.GuessGameService;
import com.dyahan.core.guess.GuessRoundView;
import com.dyahan.core.guess.GuessSubmissionResult;
import com.dyahan.core.guess.storage.GuessImageUrlService;
import com.dyahan.core.user.api.CurrentUserResolver;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/guess-rounds")
public class GuessRoundController {
    private final GuessGameService guessGameService;
    private final GuessImageUrlService guessImageUrlService;
    private final CurrentUserResolver currentUserResolver;

    public GuessRoundController(
            GuessGameService guessGameService,
            GuessImageUrlService guessImageUrlService,
            CurrentUserResolver currentUserResolver
    ) {
        this.guessGameService = guessGameService;
        this.guessImageUrlService = guessImageUrlService;
        this.currentUserResolver = currentUserResolver;
    }

    @PostMapping
    public StartRoundResponse startRound(
            @RequestHeader(value = "Authorization", required = false)
            String authorizationHeader
    ) {
        UUID userId = currentUserResolver.requireUserId(authorizationHeader);
        GuessRoundView round = guessGameService.startRound(userId);

        String imageUrl = guessImageUrlService.createPresignedGetUrl(
                round.imageObjectKey()
        );

        return new StartRoundResponse(
                round.roundId(),
                round.imageObjectKey(),
                imageUrl,
                round.hint(),
                round.expiresAt()
        );
    }

    @PostMapping("/{roundId}/answers")
    public GuessSubmissionResult submitAnswer(
            @RequestHeader(value = "Authorization", required = false)
            String authorizationHeader,
            @PathVariable UUID roundId,
            @Valid @RequestBody AnswerRequest request
    ) {
        UUID userId = currentUserResolver.requireUserId(authorizationHeader);

        return guessGameService.submitAnswer(
                userId,
                roundId,
                request.answer()
        );
    }

    public record AnswerRequest(
            @NotBlank
            @Size(max = 240)
            String answer
    ) {
    }

    public record StartRoundResponse(
            UUID roundId,
            String imageObjectKey,
            String imageUrl,
            String hint,
            OffsetDateTime expiresAt
    ) {
    }
}