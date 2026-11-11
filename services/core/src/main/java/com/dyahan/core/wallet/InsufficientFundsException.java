package com.dyahan.core.wallet;

public class InsufficientFundsException extends IllegalStateException {

  public InsufficientFundsException() {
    super("Недостаточно доступных КУМ для операции");
  }
}
