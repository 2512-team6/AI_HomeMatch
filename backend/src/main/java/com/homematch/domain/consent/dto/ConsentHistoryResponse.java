package com.homematch.domain.consent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class ConsentHistoryResponse {
    private ConsentRecordResponse current; // 현재 유효(없으면 null)
    private List<ConsentRecordResponse> history; // 최신순
}

