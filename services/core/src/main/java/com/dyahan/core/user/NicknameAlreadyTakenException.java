package com.dyahan.core.user;

public class NicknameAlreadyTakenException extends RuntimeException {
    public NicknameAlreadyTakenException() {
        super("Этот ник уже занят");
    }
}