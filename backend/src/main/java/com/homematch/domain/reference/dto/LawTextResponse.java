package com.homematch.domain.reference.dto;

import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LawTextResponse {
    private Long id;
    private Integer sourceYear;
    private String sourceName;
    private String title;
    private String text;
}
