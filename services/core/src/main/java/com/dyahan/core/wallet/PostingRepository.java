package com.dyahan.core.wallet;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostingRepository extends JpaRepository<Posting, UUID> {
    List<Posting> findAllByTransaction_IdOrderByCreatedAtAscIdAsc(UUID transactionId);
}