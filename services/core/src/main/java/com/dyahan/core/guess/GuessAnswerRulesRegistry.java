package com.dyahan.core.guess;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class GuessAnswerRulesRegistry {
    private final Map<String, GuessAnswerRules> rulesByVersion;

    public GuessAnswerRulesRegistry(List<GuessAnswerRules> rules) {
        Map<String, GuessAnswerRules> indexedRules = new HashMap<>();

        for (GuessAnswerRules rule : rules) {
            GuessAnswerRules previous = indexedRules.putIfAbsent(
                    rule.version(),
                    rule
            );

            if (previous != null) {
                throw new IllegalStateException(
                        "Для версии правил угадайки зарегистрировано несколько реализаций: "
                                + rule.version()
                );
            }
        }

        this.rulesByVersion = Map.copyOf(indexedRules);
    }

    public GuessAnswerRules require(String version) {
        GuessAnswerRules rules = rulesByVersion.get(version);

        if (rules == null) {
            throw new UnsupportedGuessRulesVersionException(version);
        }

        return rules;
    }
}