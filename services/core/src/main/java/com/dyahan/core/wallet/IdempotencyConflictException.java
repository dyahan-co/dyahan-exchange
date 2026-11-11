package com.dyahan.core.wallet;

public class IdempotencyConflictException extends RuntimeException {
    public IdempotencyConflictException() {
        super("Ключ идемпотентности уже использован с другим запросом");
    }
}