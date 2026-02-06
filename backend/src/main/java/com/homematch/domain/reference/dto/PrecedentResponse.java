package com.homematch.domain.reference.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrecedentResponse {
    private String precedentId;
    private String caseName;
    private String caseNumber;
    private LocalDate decisionDate;
    private String courtName;
    private String judgmentType;
    private String issues;
    private String summary;
    private String referencedLaws;
    private String referencedCases;
    private String fullText;
}
