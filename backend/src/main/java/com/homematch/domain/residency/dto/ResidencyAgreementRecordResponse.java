package com.homematch.domain.residency.dto;

import com.homematch.domain.residency.ResidencyAgreementRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidencyAgreementRecordResponse {
    private Long id;
    private Long defectIssueId;
    private ResidencyAgreementRecord.Counterpart counterpart;
    private ResidencyAgreementRecord.CommunicationType communicationType;
    private String summary;
    private LocalDateTime createdAt;
}

