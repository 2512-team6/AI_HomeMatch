// src/main/java/com/homematch/domain/contract/dto/FastApiAnalyzeResponse.java
package com.homematch.domain.contract.dto;

import com.fasterxml.jackson.databind.JsonNode;

public class FastApiAnalyzeResponse {

    private boolean ok;

    // LLM이 반환한 원문(JSON 문자열)
    private String answer_raw;

    // 파싱된 JSON (conclusion, risk_points, law_basis ...)
    // 구조가 고정돼 있지만, 최소기능 단계에서는 JsonNode로 받는 게 안전
    private JsonNode answer_json;

    // JSON 파싱 실패 여부
    private boolean parse_error;

    // 에러 메시지 (nullable)
    private String error_message;

    public FastApiAnalyzeResponse() {}

    public boolean isOk() {
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public String getAnswer_raw() {
        return answer_raw;
    }

    public void setAnswer_raw(String answer_raw) {
        this.answer_raw = answer_raw;
    }

    public JsonNode getAnswer_json() {
        return answer_json;
    }

    public void setAnswer_json(JsonNode answer_json) {
        this.answer_json = answer_json;
    }

    public boolean isParse_error() {
        return parse_error;
    }

    public void setParse_error(boolean parse_error) {
        this.parse_error = parse_error;
    }

    public String getError_message() {
        return error_message;
    }

    public void setError_message(String error_message) {
        this.error_message = error_message;
    }
}
