package com.homematch.domain.residency;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResidencyAgreementRecordRepository extends JpaRepository<ResidencyAgreementRecord, Long> {

    @Query("SELECT a FROM ResidencyAgreementRecord a JOIN a.user u WHERE u.user_no = :userNo ORDER BY a.createdAt DESC, a.id DESC")
    List<ResidencyAgreementRecord> findRecentByUserNo(@Param("userNo") Integer userNo, Pageable pageable);
}

