package com.homematch.domain.contract.controller;

import com.homematch.domain.contract.dto.ContractCheckRequest;
import com.homematch.domain.contract.service.ContractCheckService;
import com.homematch.domain.contract.service.ContractCheckService.ClauseCheckResult;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.annotation.PostConstruct;

import java.util.List;


@RestController
@RequestMapping("/api/contract")
public class ContractCheckController {


    @PostConstruct
    public void init() {
        System.out.println("✅ ContractCheckController loaded");
    }
    
    private final ContractCheckService contractCheckService;

    public ContractCheckController(ContractCheckService contractCheckService) {
        this.contractCheckService = contractCheckService;
    }

    /**
     * Front -> Spring
     * clauses[] 를 받아서 조항별 분석 결과 리스트 반환
     */
    @PostMapping("/check")
    public ResponseEntity<List<ClauseCheckResult>> checkClauses(
            @Valid @RequestBody ContractCheckRequest request
    ) {
        List<ClauseCheckResult> results = contractCheckService.checkClauses(request);
        return ResponseEntity.ok(results);
    }
}

