package com.homematch.domain.contract.repository;

import com.homematch.domain.contract.entity.ClauseAnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClauseAnalysisResultRepository extends JpaRepository<ClauseAnalysisResult, Long> {

    @Modifying
    @Query("DELETE FROM ClauseAnalysisResult c WHERE c.contract.contractId = :contractId")
    void deleteByContractContractId(@Param("contractId") Long contractId);
}
