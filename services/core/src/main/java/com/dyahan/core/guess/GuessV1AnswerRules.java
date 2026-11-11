package com.dyahan.core.guess;

import org.springframework.stereotype.Component;

@Component
public class GuessV1AnswerRules implements GuessAnswerRules {
    private final GuessAnswerNormalizer normalizer;

    public GuessV1AnswerRules(GuessAnswerNormalizer normalizer) {
        this.normalizer = normalizer;
    }

    @Override
    public String version() {
        return GuessAnswerNormalizer.RULES_VERSION;
    }

    @Override
    public String normalize(String rawAnswer) {
        return normalizer.normalize(rawAnswer);
    }

    @Override
    public boolean matches(String normalizedAnswer, GuessQuestion question) {
        return question.getAnswerNormalized().equals(normalizedAnswer)
                || question.getAliases().contains(normalizedAnswer);
    }
}