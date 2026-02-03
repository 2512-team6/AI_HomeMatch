package com.homematch.domain.consent.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ConsentWithdrawRequest {
    private String consentType;
    private String version; // 선택: 비우면 해당 타입의 모든 활성 동의 철회
}

