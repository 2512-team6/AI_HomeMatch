package com.homematch.domain.residency.dto;

import com.homematch.domain.residency.ResidencyIssueTimeline;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidencyIssueTimelineResponse {
    private Long id;
    private Long defectIssueId;
    private ResidencyIssueTimeline.EventType eventType;
    private String note;
    private LocalDateTime createdAt;
}

