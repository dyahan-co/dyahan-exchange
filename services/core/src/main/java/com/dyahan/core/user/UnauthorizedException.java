package com.dyahan.core.user;

public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException() {
        super("Требуется действующая сессия");
    }
}