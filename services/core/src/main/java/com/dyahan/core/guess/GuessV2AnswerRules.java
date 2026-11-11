package com.dyahan.core.guess;

import org.springframework.stereotype.Component;

@Component
public class GuessV2AnswerRules implements GuessAnswerRules {
    private static final String VERSION = "guess-v2";

    private final GuessAnswerNormalizer normalizer;

    public GuessV2AnswerRules(GuessAnswerNormalizer normalizer) {
        this.normalizer = normalizer;
    }

    @Override
    public String version() {
        return VERSION;
    }

    @Override
    public String normalize(String rawAnswer) {
        return normalizer.normalize(rawAnswer);
    }

    @Override
    public boolean matches(String normalizedAnswer, GuessQuestion question) {
        if (normalizedAnswer == null || question == null) {
            return false;
        }

        if (matchesWithTypo(normalizedAnswer, question.getAnswerNormalized())) {
            return true;
        }

        return question.getAliases().stream()
                .anyMatch(alias -> matchesWithTypo(normalizedAnswer, alias));
    }

    private boolean matchesWithTypo(String answer, String expected) {
        if (expected.equals(answer)) {
            return true;
        }

        int expectedLength = expected.codePointCount(0, expected.length());
        int allowedDistance = allowedDistance(expectedLength);

        if (allowedDistance == 0) {
            return false;
        }

        int[] left = expected.codePoints().toArray();
        int[] right = answer.codePoints().toArray();

        if (Math.abs(left.length - right.length) > allowedDistance) {
            return false;
        }

        return damerauLevenshteinDistance(left, right) <= allowedDistance;
    }

    private int allowedDistance(int answerLength) {
        if (answerLength < 4) {
            return 0;
        }
        if (answerLength < 8) {
            return 1;
        }
        return 2;
    }

    /**
     * Optimal String Alignment distance: insertions, deletions,
     * substitutions and one adjacent transposition each cost one edit.
     * Operates on Unicode code points rather than UTF-16 char units.
     */
    private int damerauLevenshteinDistance(int[] left, int[] right) {
        int[][] distance = new int[left.length + 1][right.length + 1];

        for (int i = 0; i <= left.length; i++) {
            distance[i][0] = i;
        }
        for (int j = 0; j <= right.length; j++) {
            distance[0][j] = j;
        }

        for (int i = 1; i <= left.length; i++) {
            for (int j = 1; j <= right.length; j++) {
                int substitutionCost = left[i - 1] == right[j - 1] ? 0 : 1;

                int best = Math.min(
                        distance[i - 1][j] + 1,
                        Math.min(
                                distance[i][j - 1] + 1,
                                distance[i - 1][j - 1] + substitutionCost
                        )
                );

                if (i > 1
                        && j > 1
                        && left[i - 1] == right[j - 2]
                        && left[i - 2] == right[j - 1]) {
                    best = Math.min(best, distance[i - 2][j - 2] + 1);
                }

                distance[i][j] = best;
            }
        }

        return distance[left.length][right.length];
    }
}