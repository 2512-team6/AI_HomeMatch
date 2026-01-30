package com.homematch.domain.residency.dto;

import com.homematch.domain.residency.ResidencyDefectIssue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidencyDefectIssueRequest {
    private String title;
    private String imageUrl;
    private LocalDate issueDate;
    private ResidencyDefectIssue.IssueStatus status;
    private ResidencyDefectIssue.RiskLevel riskLevel;
    private String memo;
}
