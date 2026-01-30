package com.homematch.domain.residency.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.homematch.domain.residency.ResidencyAgreementRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidencyAgreementRecordRequest {

    private ResidencyAgreementRecord.Counterpart counterpart;

    @JsonAlias({"communication_type"})
    private ResidencyAgreementRecord.CommunicationType communicationType;

    private String summary;

    @JsonAlias({"defect_issue_id"})
    private Long defectIssueId;
}

