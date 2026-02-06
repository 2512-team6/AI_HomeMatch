package com.homematch.domain.reference.dto;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediationCaseResponse {
    private Integer caseId;
    private Integer sourceYear;
    private String sourceName;
    private String title;
    private String facts;
    private String issues;
    private String relatedRules;
    private String relatedPrecedents;
    private String result;
    private String orderText;
}
