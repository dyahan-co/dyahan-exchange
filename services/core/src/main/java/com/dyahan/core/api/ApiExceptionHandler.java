package com.dyahan.core.api;

import com.dyahan.core.user.InvalidCredentialsException;
import com.dyahan.core.user.NicknameAlreadyTakenException;
import com.dyahan.core.user.UnauthorizedException;
import com.dyahan.core.wallet.InsufficientFundsException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

import org.springframework.http.converter.HttpMessageNotReadableException;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestControllerAdvice
public class ApiExceptionHandler {

  private static final Logger log =
    LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(InsufficientFundsException.class)
  public ResponseEntity<ApiError> insufficientFunds(
    InsufficientFundsException exception
  ) {
    return error(
      HttpStatus.UNPROCESSABLE_ENTITY,
      "INSUFFICIENT_FUNDS",
      exception.getMessage(),
      false
    );
  }

  @ExceptionHandler(UnauthorizedException.class)
  public ResponseEntity<ApiError> unauthorized(
    UnauthorizedException exception
  ) {
    return error(
      HttpStatus.UNAUTHORIZED,
      "UNAUTHORIZED",
      exception.getMessage(),
      false
    );
  }

  @ExceptionHandler(InvalidCredentialsException.class)
  public ResponseEntity<ApiError> invalidCredentials(
    InvalidCredentialsException exception
  ) {
    return error(
      HttpStatus.UNAUTHORIZED,
      "INVALID_CREDENTIALS",
      exception.getMessage(),
      false
    );
  }

  @ExceptionHandler(NicknameAlreadyTakenException.class)
  public ResponseEntity<ApiError> nicknameTaken(
    NicknameAlreadyTakenException exception
  ) {
    return error(
      HttpStatus.CONFLICT,
      "NICKNAME_TAKEN",
      exception.getMessage(),
      false
    );
  }

  @ExceptionHandler({
    MethodArgumentNotValidException.class,
    MethodArgumentTypeMismatchException.class,
    HttpMessageNotReadableException.class,
    MissingRequestHeaderException.class
  })
  public ResponseEntity<ApiError> invalidRequest(Exception exception) {
    return error(
      HttpStatus.BAD_REQUEST,
      "INVALID_REQUEST",
      "Проверьте поля запроса, идентификаторы и обязательные заголовки",
      false
    );
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiError> responseStatus(
    ResponseStatusException exception
  ) {
    HttpStatusCode status = exception.getStatusCode();

    // Не раскрываем причины внутренних ошибок клиенту.
    if (status.is5xxServerError()) {
      return internalError(exception);
    }

    String code = switch (status.value()) {
      case 400 -> "INVALID_REQUEST";
      case 401 -> "UNAUTHORIZED";
      case 403 -> "FORBIDDEN";
      case 404 -> "NOT_FOUND";
      case 409 -> "CONFLICT";
      case 422 -> "BUSINESS_RULE_VIOLATION";
      default -> "REQUEST_REJECTED";
    };

    String message = exception.getReason() != null
      ? exception.getReason()
      : "Запрос отклонён";

    return error(status, code, message, false);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> unexpected(Exception exception) {
    return internalError(exception);
  }

  private ResponseEntity<ApiError> internalError(Exception exception) {
    String requestId = UUID.randomUUID().toString();

    log.error(
      "Внутренняя ошибка API, requestId={}",
      requestId,
      exception
    );

    return response(
      HttpStatus.INTERNAL_SERVER_ERROR,
      new ApiError(
        500,
        "INTERNAL_ERROR",
        "Не удалось выполнить операцию. Обновите состояние перед повтором.",
        requestId,
        false
      )
    );
  }

  private ResponseEntity<ApiError> error(
    HttpStatusCode status,
    String code,
    String message,
    boolean retryable
  ) {
    return response(
      status,
      new ApiError(
        status.value(),
        code,
        message,
        UUID.randomUUID().toString(),
        retryable
      )
    );
  }

  private ResponseEntity<ApiError> response(
    HttpStatusCode status,
    ApiError body
  ) {
    return ResponseEntity.status(status)
      .header("Cache-Control", "no-store")
      .header("X-Request-ID", body.requestId())
      .body(body);
  }

  public record ApiError(
    int status,
    String code,
    String message,
    String requestId,
    boolean retryable
  ) {
  }
}
