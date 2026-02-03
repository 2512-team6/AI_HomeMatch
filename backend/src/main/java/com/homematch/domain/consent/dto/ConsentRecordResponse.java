package com.homematch.domain.consent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Builder
public class ConsentRecordResponse {
    private Integer consentId;
    private String consentType;
    private String version;
    private String contentHash;
    private String consentContent;
    private LocalDateTime agreedAt;
    private LocalDateTime withdrawnAt;
}

