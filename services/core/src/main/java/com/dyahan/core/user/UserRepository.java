package com.dyahan.core.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    boolean existsByNicknameNormalized(String nicknameNormalized);

    Optional<User> findByNicknameNormalized(String nicknameNormalized);
}