package com.homematch.domain.contract.service;

import com.homematch.domain.contract.dto.BulkClauseAnalysisSaveRequest;
import com.homematch.domain.contract.dto.CreateContractRequest;
import com.homematch.domain.contract.dto.CreateContractResponse;
import com.homematch.domain.contract.entity.ClauseAnalysisResult;
import com.homematch.domain.contract.entity.Contract;
import com.homematch.domain.contract.entity.ContractLevel;
import com.homematch.domain.contract.repository.ClauseAnalysisResultRepository;
import com.homematch.domain.contract.repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final ClauseAnalysisResultRepository clauseAnalysisResultRepository;

    @Transactional
    public CreateContractResponse createContract(CreateContractRequest req, Long userId) {
        // uploaded_at: 파일 업로드 기반이 아직 없으니, fileName이 있으면 "지금"으로 기록하는 정도로 처리
        LocalDateTime uploadedAt = (req.getFileName() != null && !req.getFileName().isBlank())
                ? LocalDateTime.now()
                : null;

        Contract saved = contractRepository.save(
                Contract.builder()
                        .userId(userId)
                        .fileName(req.getFileName())
                        .mimeType(req.getMimeType())
                        .fileSizeBytes(req.getFileSizeBytes())
                        .uploadedAt(uploadedAt)
                        .contractAlias(req.getContractAlias())
                        .specialTermCount(req.getSpecialTermCount())
                        .build()
        );

        return CreateContractResponse.builder()
                .contractId(saved.getContractId())
                .build();
    }

    @Transactional
    public void saveClauseAnalysisBulk(Long contractId, BulkClauseAnalysisSaveRequest req) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("contract not found: " + contractId));

        List<ClauseAnalysisResult> entities = req.getRows().stream()
                .map(row -> ClauseAnalysisResult.builder()
                        .contract(contract)
                        .clauseIndex(row.getClauseIndex())
                        .clauseText(row.getClauseText())
                        .level(ContractLevel.valueOf(row.getLevel()))
                        .conclusion(row.getConclusion())

                        .riskPoints(row.getRiskPoints())

                        // TEXT: List -> "\n" join
                        .mediationSummaries(joinLines(row.getMediationSummaries()))
                        .mediationCaseIds(row.getMediationCaseIds())

                        .precedentSummaries(joinLines(row.getPrecedentSummaries()))
                        .precedentCaseIds(row.getPrecedentCaseIds())
                        .precedentEvidence(row.getPrecedentEvidence())

                        .lawSummaries(joinLines(row.getLawSummaries()))
                        .lawIds(row.getLawIds())

                        .recommendedClauseText(row.getRecommendedClauseText())
                        .build()
                )
                .toList();

        clauseAnalysisResultRepository.saveAll(entities);
    }

    private String joinLines(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        // 빈 문자열만 있는 경우는 null 처리
        List<String> cleaned = list.stream().map(s -> s == null ? "" : s.trim()).filter(s -> !s.isBlank()).toList();
        if (cleaned.isEmpty()) return null;
        return String.join("\n", cleaned);
    }
}
