package com.dyahan.core.api;

import com.dyahan.core.guess.GuessRoundNotFoundException;
import com.dyahan.core.guess.GuessSubmissionConflictException;
import com.dyahan.core.user.InvalidCredentialsException;
import com.dyahan.core.user.NicknameAlreadyTakenException;
import com.dyahan.core.user.UnauthorizedException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ApiError handleUnauthorized(UnauthorizedException exception) {
        return error(
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                exception.getMessage()
        );
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ApiError handleInvalidCredentials(InvalidCredentialsException exception) {
        return error(
                HttpStatus.UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                exception.getMessage()
        );
    }

    @ExceptionHandler(NicknameAlreadyTakenException.class)
    public ApiError handleNicknameAlreadyTaken(
            NicknameAlreadyTakenException exception
    ) {
        return error(
                HttpStatus.CONFLICT,
                "NICKNAME_ALREADY_TAKEN",
                exception.getMessage()
        );
    }

    @ExceptionHandler(GuessRoundNotFoundException.class)
    public ApiError handleRoundNotFound(GuessRoundNotFoundException exception) {
        return error(
                HttpStatus.NOT_FOUND,
                "GUESS_ROUND_NOT_FOUND",
                exception.getMessage()
        );
    }

    @ExceptionHandler(GuessSubmissionConflictException.class)
    public ApiError handleSubmissionConflict(
            GuessSubmissionConflictException exception
    ) {
        return error(
                HttpStatus.CONFLICT,
                "GUESS_SUBMISSION_CONFLICT",
                exception.getMessage()
        );
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            ConstraintViolationException.class,
            HttpMessageNotReadableException.class
    })
    public ApiError handleBadRequest(Exception exception) {
        return error(
                HttpStatus.BAD_REQUEST,
                "BAD_REQUEST",
                "Запрос некорректен"
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiError handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(fieldError -> fieldError.getDefaultMessage())
                .orElse("Проверьте поля запроса");

        return error(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                message
        );
    }

    private ApiError error(
            HttpStatus status,
            String code,
            String message
    ) {
        return new ApiError(
                status.value(),
                code,
                message,
                OffsetDateTime.now(ZoneOffset.UTC)
        );
    }

    public record ApiError(
            int status,
            String code,
            String message,
            OffsetDateTime timestamp
    ) {
    }
}