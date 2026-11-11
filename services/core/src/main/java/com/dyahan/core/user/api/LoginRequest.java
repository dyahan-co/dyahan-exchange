package com.dyahan.core.user.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank
        @Size(min = 3, max = 24)
        String nickname,

        @NotBlank
        @Size(min = 8, max = 72)
        String password
) {
}