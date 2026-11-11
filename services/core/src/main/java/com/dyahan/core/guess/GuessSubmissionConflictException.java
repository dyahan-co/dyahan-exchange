package com.dyahan.core.guess;

public class GuessSubmissionConflictException extends RuntimeException {
    public GuessSubmissionConflictException() {
        super("Для этого раунда уже отправлен другой ответ");
    }
}