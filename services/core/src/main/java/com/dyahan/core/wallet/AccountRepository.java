package com.dyahan.core.wallet;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {

  Optional<Account> findByOwnerIdAndCurrency(
    UUID ownerId,
    String currency
  );

  Optional<Account> findByAccountTypeAndSystemCodeAndCurrency(
    String accountType,
    String systemCode,
    String currency
  );

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("""
            select a
            from Account a
            where a.accountType = :accountType
              and a.systemCode = :systemCode
              and a.currency = :currency
            """)
  Optional<Account> findSystemAccountForUpdate(
    @Param("accountType") String accountType,
    @Param("systemCode") String systemCode,
    @Param("currency") String currency
  );

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("""
            select a
            from Account a
            where a.ownerId = :ownerId
              and a.currency = :currency
              and a.accountType = 'USER'
            """)
  Optional<Account> findUserAccountForUpdate(
    @Param("ownerId") UUID ownerId,
    @Param("currency") String currency
  );

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("""
            select a
            from Account a
            where a.id in :ids
            order by a.id
            """)
  List<Account> findAllByIdForUpdate(@Param("ids") List<UUID> ids);
}
