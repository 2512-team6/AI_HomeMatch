package com.homematch.domain.residency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResidencyIssueTimelineRepository extends JpaRepository<ResidencyIssueTimeline, Long> {

    List<ResidencyIssueTimeline> findByDefectIssue_IdOrderByCreatedAtDescIdDesc(Long defectIssueId);

    Optional<ResidencyIssueTimeline> findTopByDefectIssue_IdOrderByCreatedAtDescIdDesc(Long defectIssueId);
}

