package com.dyahan.core.guess;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GuessQuestionRepository extends JpaRepository<GuessQuestion, UUID> {
    List<GuessQuestion> findAllByActiveTrue();
}