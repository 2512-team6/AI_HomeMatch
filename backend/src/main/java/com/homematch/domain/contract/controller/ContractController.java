package com.homematch.domain.contract.controller;

import com.homematch.domain.contract.dto.BulkClauseAnalysisSaveRequest;
import com.homematch.domain.contract.dto.CreateContractRequest;
import com.homematch.domain.contract.dto.CreateContractResponse;
import com.homematch.domain.contract.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class ContractController {

    private final ContractService contractService;

    @PostMapping("/contracts")
    public ResponseEntity<CreateContractResponse> createContract(@Valid @RequestBody CreateContractRequest req) {
        // TODO: Security 붙이면 토큰/세션에서 userId 추출
        Long userId = 1L; // 임시
        return ResponseEntity.ok(contractService.createContract(req, userId));
    }

    @PostMapping("/contracts/{contractId}/clause-analysis-results:bulk")
    public ResponseEntity<Void> saveBulk(
            @PathVariable Long contractId,
            @Valid @RequestBody BulkClauseAnalysisSaveRequest req
    ) {
        System.out.println("[clause-analysis:bulk] 진입 contractId=" + contractId + ", rows=" + (req.getRows() != null ? req.getRows().size() : 0));
        try {
            contractService.saveClauseAnalysisBulk(contractId, req);
            System.out.println("[clause-analysis:bulk] Controller 정상 반환");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("[clause-analysis:bulk] Controller 예외: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
