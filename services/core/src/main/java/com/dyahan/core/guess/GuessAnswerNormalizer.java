package com.dyahan.core.guess;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;

@Component
public class GuessAnswerNormalizer {
    public static final String RULES_VERSION = "guess-v1";
    private static final int MAX_CODE_POINTS = 240;

    public String normalize(String rawAnswer) {
        if (rawAnswer == null) {
            throw new IllegalArgumentException("Ответ не может быть пустым");
        }

        String normalized = Normalizer.normalize(rawAnswer, Normalizer.Form.NFKC)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[\\p{Z}\\s]+", " ")
                .strip();

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Ответ не может быть пустым");
        }

        if (normalized.codePointCount(0, normalized.length()) > MAX_CODE_POINTS) {
            throw new IllegalArgumentException("Ответ не должен превышать 240 символов");
        }

        return normalized;
    }
}