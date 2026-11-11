package com.dyahan.core.guess;

public class GuessRoundNotFoundException extends RuntimeException {
    public GuessRoundNotFoundException() {
        super("Раунд не найден");
    }
}