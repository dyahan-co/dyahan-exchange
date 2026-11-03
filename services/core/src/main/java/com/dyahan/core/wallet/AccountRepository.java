package com.dyahan.core.wallet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    Optional<Account> findByOwnerIdAndCurrency(UUID ownerId, String currency);

    Optional<Account> findByAccountTypeAndSystemCodeAndCurrency(
            String accountType,
            String systemCode,
            String currency
    );
}