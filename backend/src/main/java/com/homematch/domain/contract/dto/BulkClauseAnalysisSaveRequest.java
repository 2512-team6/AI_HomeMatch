package com.homematch.domain.contract.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkClauseAnalysisSaveRequest {

    @NotEmpty(message = "rows는 비어 있을 수 없습니다.")
    @Valid
    private List<ClauseAnalysisRow> rows;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClauseAnalysisRow {

        // clause_analysis_results
        private Integer clauseIndex;     // 0부터
        private String clauseText;

        // DB enum 값 그대로 받는 걸 추천: SAFE / NEEDS_UNDERSTANDING / NEEDS_REVIEW
        private String level;

        private String conclusion;

        // JSON 컬럼들: 프론트에서 배열로 보내면 Jackson이 List로 받음
        private List<String> riskPoints;

        private List<String> mediationSummaries;
        private List<String> mediationCaseIds;

        private List<String> precedentSummaries;
        private List<String> precedentCaseIds;
        private List<String> precedentEvidence;

        private List<String> lawSummaries;
        private List<String> lawIds;

        private String recommendedClauseText;
    }
}
