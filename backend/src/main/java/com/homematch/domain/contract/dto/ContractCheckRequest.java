// src/main/java/com/homematch/domain/contract/dto/ContractCheckRequest.java
package com.homematch.domain.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class ContractCheckRequest {

    @NotEmpty(message = "clauses는 비어 있을 수 없습니다.")
    private List<@NotBlank(message = "clauses 항목은 빈 문자열일 수 없습니다.") String> clauses;

    // optional (FastAPI strict 연동용, 기본 false로 취급)
    private Boolean strict;

    public ContractCheckRequest() {}

    public ContractCheckRequest(List<String> clauses, Boolean strict) {
        this.clauses = clauses;
        this.strict = strict;
    }

    public List<String> getClauses() {
        return clauses;
    }

    public void setClauses(List<String> clauses) {
        this.clauses = clauses;
    }

    public Boolean getStrict() {
        return strict;
    }

    public void setStrict(Boolean strict) {
        this.strict = strict;
    }

    public boolean strictOrFalse() {
        return strict != null && strict;
    }
}
