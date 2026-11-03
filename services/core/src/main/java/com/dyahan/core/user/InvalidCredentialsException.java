package com.dyahan.core.user;

public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("Неверный ник или пароль");
    }
}