package com.dyahan.core.guess;

public interface GuessAnswerRules {
    String version();

    String normalize(String rawAnswer);

    boolean matches(String normalizedAnswer, GuessQuestion question);
}