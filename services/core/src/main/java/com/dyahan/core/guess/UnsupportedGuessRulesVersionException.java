package com.dyahan.core.guess;

public class UnsupportedGuessRulesVersionException extends RuntimeException {
    public UnsupportedGuessRulesVersionException(String version) {
        super("Версия правил угадайки не поддерживается: " + version);
    }
}