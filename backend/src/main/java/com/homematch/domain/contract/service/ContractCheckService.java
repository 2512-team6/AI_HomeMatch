package com.homematch.domain.contract.service;

import com.homematch.domain.contract.client.FastApiClient;
import com.homematch.domain.contract.dto.ContractCheckRequest;
import com.homematch.domain.contract.dto.FastApiAnalyzeResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ContractCheckService {

    private final FastApiClient fastApiClient;

    public ContractCheckService(FastApiClient fastApiClient) {
        this.fastApiClient = fastApiClient;
    }

    /**
     * 계약서 특약사항 점검
     * - clauses를 순차 처리
     * - FastAPI는 단건 분석만 가능하므로 clause별 호출
     */
    public List<ClauseCheckResult> checkClauses(ContractCheckRequest request) {
        List<ClauseCheckResult> results = new ArrayList<>();

        boolean strict = request.strictOrFalse();

        int index = 0;
        for (String clause : request.getClauses()) {
            FastApiAnalyzeResponse response;

            try {
                response = fastApiClient.analyzeClause(clause, strict);
            } catch (Exception e) {
                // FastAPI 호출 자체가 실패한 경우
                response = buildErrorResponse(e);
            }

            ClauseCheckResult result = ClauseCheckResult.of(
                    index,
                    clause,
                    response
            );

            results.add(result);
            index++;
        }

        return results;
    }

    private FastApiAnalyzeResponse buildErrorResponse(Exception e) {
        FastApiAnalyzeResponse error = new FastApiAnalyzeResponse();
        error.setOk(false);
        error.setParse_error(true);
        error.setError_message(e.getMessage());
        return error;
    }

    /**
     * 조항별 결과 DTO (Service 전용, Controller로 그대로 전달)
     */
    public static class ClauseCheckResult {

        private int index;
        private String clause;
        private FastApiAnalyzeResponse analysis;

        public ClauseCheckResult() {}

        public ClauseCheckResult(int index, String clause, FastApiAnalyzeResponse analysis) {
            this.index = index;
            this.clause = clause;
            this.analysis = analysis;
        }

        public static ClauseCheckResult of(
                int index,
                String clause,
                FastApiAnalyzeResponse analysis
        ) {
            return new ClauseCheckResult(index, clause, analysis);
        }

        public int getIndex() {
            return index;
        }

        public String getClause() {
            return clause;
        }

        public FastApiAnalyzeResponse getAnalysis() {
            return analysis;
        }
    }
}
