package com.homematch.domain.consent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class ConsentStatusResponse {
    private boolean hasAll;
    private List<String> missingTypes;
}

