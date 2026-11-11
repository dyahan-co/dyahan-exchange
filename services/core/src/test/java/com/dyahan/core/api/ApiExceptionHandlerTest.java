package com.dyahan.core.api;

import com.dyahan.core.user.InvalidCredentialsException;
import com.dyahan.core.user.NicknameAlreadyTakenException;
import com.dyahan.core.user.UnauthorizedException;
import com.dyahan.core.wallet.InsufficientFundsException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.http.HttpStatus;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ApiExceptionHandlerTest {

  private MockMvc mvc;

  @BeforeEach
  void prepare() {
    mvc = MockMvcBuilders
      .standaloneSetup(new ProbeController())
      .setControllerAdvice(new ApiExceptionHandler())
      .build();
  }

  @Test
  void returns422ForInsufficientFunds() throws Exception {
    mvc.perform(get("/probe/funds"))
      .andExpect(status().is(422))
      .andExpect(jsonPath("$.code")
        .value("INSUFFICIENT_FUNDS"))
      .andExpect(jsonPath("$.retryable").value(false))
      .andExpect(jsonPath("$.requestId").isNotEmpty())
      .andExpect(header().string(
        "Cache-Control",
        "no-store"
      ))
      .andExpect(header().exists("X-Request-ID"));
  }

  @Test
  void returns401ForMissingSession() throws Exception {
    mvc.perform(get("/probe/session"))
      .andExpect(status().isUnauthorized())
      .andExpect(jsonPath("$.code")
        .value("UNAUTHORIZED"));
  }

  @Test
  void returns401ForInvalidCredentials() throws Exception {
    mvc.perform(get("/probe/login"))
      .andExpect(status().isUnauthorized())
      .andExpect(jsonPath("$.code")
        .value("INVALID_CREDENTIALS"));
  }

  @Test
  void returns409ForTakenNickname() throws Exception {
    mvc.perform(get("/probe/nickname"))
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.code")
        .value("NICKNAME_TAKEN"));
  }

  @Test
  void preservesExpectedConflict() throws Exception {
    mvc.perform(get("/probe/conflict"))
      .andExpect(status().isConflict())
      .andExpect(jsonPath("$.code").value("CONFLICT"))
      .andExpect(jsonPath("$.message")
        .value("Предыдущий раунд ещё не завершён"));
  }

  @Test
  void rejectsMissingAndMalformedHeaders() throws Exception {
    mvc.perform(get("/probe/key"))
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code")
        .value("INVALID_REQUEST"));

    mvc.perform(
        get("/probe/key")
          .header("Idempotency-Key", "not-a-uuid")
      )
      .andExpect(status().isBadRequest())
      .andExpect(jsonPath("$.code")
        .value("INVALID_REQUEST"));
  }

  @Test
  void hidesInternalErrorDetails() throws Exception {
    mvc.perform(get("/probe/internal"))
      .andExpect(status().isInternalServerError())
      .andExpect(jsonPath("$.code")
        .value("INTERNAL_ERROR"))
      .andExpect(content().string(
        not(containsString("private-database-details"))
      ));
  }

  @RestController
  static class ProbeController {

    @GetMapping("/probe/funds")
    public void funds() {
      throw new InsufficientFundsException();
    }

    @GetMapping("/probe/session")
    public void session() {
      throw new UnauthorizedException();
    }

    @GetMapping("/probe/login")
    public void login() {
      throw new InvalidCredentialsException();
    }

    @GetMapping("/probe/nickname")
    public void nickname() {
      throw new NicknameAlreadyTakenException();
    }

    @GetMapping("/probe/conflict")
    public void conflict() {
      throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "Предыдущий раунд ещё не завершён"
      );
    }

    @GetMapping("/probe/key")
    public String key(
      @RequestHeader("Idempotency-Key") UUID key
    ) {
      return key.toString();
    }

    @GetMapping("/probe/internal")
    public void internal() {
      throw new IllegalStateException(
        "private-database-details"
      );
    }
  }
}
