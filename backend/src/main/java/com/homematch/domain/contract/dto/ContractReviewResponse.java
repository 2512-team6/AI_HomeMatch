package com.homematch.domain.contract.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractReviewResponse {
    private Long id;
    private List<String> filePaths;
    private List<String> specialTerms;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

