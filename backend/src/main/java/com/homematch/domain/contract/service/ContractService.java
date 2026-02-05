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
        System.out.println("[clause-analysis:bulk] Service 1. findById 직전 contractId=" + contractId);
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("contract not found: " + contractId));
        System.out.println("[clause-analysis:bulk] Service 2. findById 완료");

        System.out.println("[clause-analysis:bulk] Service 3. deleteByContractContractId 직전");
        clauseAnalysisResultRepository.deleteByContractContractId(contractId);
        System.out.println("[clause-analysis:bulk] Service 4. deleteByContractContractId 완료");

        System.out.println("[clause-analysis:bulk] Service 5. entities 빌드 직전 rows=" + req.getRows().size());
        List<ClauseAnalysisResult> entities;
        try {
            entities = req.getRows().stream()
                    .map(row -> ClauseAnalysisResult.builder()
                            .contract(contract)
                            .clauseIndex(row.getClauseIndex() != null ? row.getClauseIndex() : 0)
                            .clauseText(clauseTextOrEmpty(row.getClauseText()))
                            .level(safeParseLevel(row.getLevel()))
                            .conclusion(blankToNull(row.getConclusion()))

                            .riskPoints(row.getRiskPoints())

                            .mediationSummaries(joinLines(row.getMediationSummaries()))
                            .mediationCaseIds(row.getMediationCaseIds())

                            .precedentSummaries(joinLines(row.getPrecedentSummaries()))
                            .precedentCaseIds(row.getPrecedentCaseIds())
                            .precedentEvidence(row.getPrecedentEvidence())

                            .lawSummaries(joinLines(row.getLawSummaries()))
                            .lawIds(row.getLawIds())

                            .recommendedClauseText(blankToNull(row.getRecommendedClauseText()))
                            .build()
                    )
                    .toList();
        } catch (Exception e) {
            System.err.println("[clause-analysis:bulk] Service entities 빌드 중 예외: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
        System.out.println("[clause-analysis:bulk] Service 6. entities 빌드 완료 개수=" + entities.size());

        System.out.println("[clause-analysis:bulk] Service 7. saveAll 직전");
        try {
            clauseAnalysisResultRepository.saveAll(entities);
        } catch (Exception e) {
            System.err.println("[clause-analysis:bulk] Service saveAll 중 예외: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
        System.out.println("[clause-analysis:bulk] Service 8. saveAll 완료");
    }

    private static String clauseTextOrEmpty(String text) {
        return (text != null && !text.isBlank()) ? text : "";
    }

    private static String blankToNull(String s) {
        return (s != null && !s.isBlank()) ? s : null;
    }

    private static ContractLevel safeParseLevel(String level) {
        if (level == null || level.isBlank()) return ContractLevel.NEEDS_REVIEW;
        String upper = level.trim().toUpperCase();
        if ("SAFE".equals(upper)) return ContractLevel.SAFE;
        if ("NEEDS_UNDERSTANDING".equals(upper) || "NEED_UNDERSTAND".equals(upper)) return ContractLevel.NEEDS_UNDERSTANDING;
        if ("NEEDS_REVIEW".equals(upper) || "NEED_REVIEW".equals(upper) || "NEED_FIX".equals(upper)) return ContractLevel.NEEDS_REVIEW;
        return ContractLevel.NEEDS_REVIEW;
    }

    private String joinLines(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        // 빈 문자열만 있는 경우는 null 처리
        List<String> cleaned = list.stream().map(s -> s == null ? "" : s.trim()).filter(s -> !s.isBlank()).toList();
        if (cleaned.isEmpty()) return null;
        return String.join("\n", cleaned);
    }
}
