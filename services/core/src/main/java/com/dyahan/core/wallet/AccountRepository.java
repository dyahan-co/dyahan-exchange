package com.dyahan.core.wallet;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    Optional<Account> findByOwnerIdAndCurrency(UUID ownerId, String currency);

    Optional<Account> findByAccountTypeAndSystemCodeAndCurrency(
            String accountType,
            String systemCode,
            String currency
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select account
            from Account account
            where account.accountType = :accountType
              and account.systemCode = :systemCode
              and account.currency = :currency
            """)
    Optional<Account> findSystemAccountForUpdate(
            @Param("accountType") String accountType,
            @Param("systemCode") String systemCode,
            @Param("currency") String currency
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select account
            from Account account
            where account.ownerId = :ownerId
              and account.currency = :currency
            """)
    Optional<Account> findUserAccountForUpdate(
            @Param("ownerId") UUID ownerId,
            @Param("currency") String currency
    );
}