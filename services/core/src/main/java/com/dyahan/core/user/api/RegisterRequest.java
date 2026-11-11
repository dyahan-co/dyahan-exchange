package com.dyahan.core.user.api;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank
        @Size(min = 3, max = 24)
        String nickname,

        @NotBlank
        @Size(min = 8)
        String password,

        @AssertTrue(message = "Нужно подтвердить, что КУМ и д₽ — игровые единицы")
        boolean noticeAccepted
) {}