package com.homematch.domain.contract.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateContractRequest {

    @NotBlank(message = "contractAlias는 필수입니다.")
    private String contractAlias;

    @Min(value = 0, message = "specialTermCount는 0 이상이어야 합니다.")
    private int specialTermCount;

    // 파일 메타 (현재 null 가능)
    private String fileName;
    private String mimeType;

    @Min(value = 0, message = "fileSizeBytes는 0 이상이어야 합니다.")
    private Long fileSizeBytes;
}
