package com.homematch.domain.consent.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ConsentAgreeRequest {

    @NotBlank
    private String consentType;

    @NotBlank
    private String consentContent;

    @NotBlank
    private String version;
}

