package com.homematch.domain.contract;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ContractReviewRepository extends JpaRepository<ContractReview, Long> {
    
    @Query("SELECT cr FROM ContractReview cr JOIN cr.user u WHERE u.user_no = :userNo ORDER BY cr.createdAt DESC")
    List<ContractReview> findByUserNo(@Param("userNo") Integer userNo);
    
    @Query("SELECT cr FROM ContractReview cr JOIN cr.user u WHERE u.user_no = :userNo AND cr.id = :id")
    Optional<ContractReview> findByUserNoAndId(@Param("userNo") Integer userNo, @Param("id") Long id);
}

