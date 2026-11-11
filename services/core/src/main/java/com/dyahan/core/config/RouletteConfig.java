package com.dyahan.core.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.security.SecureRandom;
import java.time.Clock;

@Configuration
@EnableScheduling
public class RouletteConfig {

  @Bean("rouletteClock")
  public Clock rouletteClock() {
    return Clock.systemUTC();
  }

  @Bean("rouletteRandom")
  public SecureRandom rouletteRandom() {
    return new SecureRandom();
  }
}
