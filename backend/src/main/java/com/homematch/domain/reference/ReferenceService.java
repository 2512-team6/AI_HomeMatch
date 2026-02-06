package com.homematch.domain.reference;

import com.homematch.domain.reference.dto.LawTextResponse;
import com.homematch.domain.reference.dto.MediationCaseResponse;
import com.homematch.domain.reference.dto.PrecedentResponse;
import com.homematch.domain.reference.entity.LawText;
import com.homematch.domain.reference.entity.MediationCase;
import com.homematch.domain.reference.entity.Precedent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReferenceService {

    private final LawTextRepository lawTextRepository;
    private final PrecedentRepository precedentRepository;
    private final MediationCaseRepository mediationCaseRepository;

    public LawTextResponse getLawById(Long id) {
        LawText e = lawTextRepository.findById(id).orElse(null);
        if (e == null) return null;
        return LawTextResponse.builder()
                .id(e.getId())
                .sourceYear(e.getSourceYear())
                .sourceName(e.getSourceName())
                .title(e.getTitle())
                .text(e.getText())
                .build();
    }

    public PrecedentResponse getPrecedentById(String precedentId) {
        Precedent e = precedentRepository.findById(precedentId).orElse(null);
        if (e == null) return null;
        return PrecedentResponse.builder()
                .precedentId(e.getPrecedentId())
                .caseName(e.getCaseName())
                .caseNumber(e.getCaseNumber())
                .decisionDate(e.getDecisionDate())
                .courtName(e.getCourtName())
                .judgmentType(e.getJudgmentType())
                .issues(e.getIssues())
                .summary(e.getSummary())
                .referencedLaws(e.getReferencedLaws())
                .referencedCases(e.getReferencedCases())
                .fullText(e.getFullText())
                .build();
    }

    public MediationCaseResponse getMediationByCaseId(Integer caseId) {
        MediationCase e = mediationCaseRepository.findById(caseId).orElse(null);
        if (e == null) return null;
        return MediationCaseResponse.builder()
                .caseId(e.getCaseId())
                .sourceYear(e.getSourceYear())
                .sourceName(e.getSourceName())
                .title(e.getTitle())
                .facts(e.getFacts())
                .issues(e.getIssues())
                .relatedRules(e.getRelatedRules())
                .relatedPrecedents(e.getRelatedPrecedents())
                .result(e.getResult())
                .orderText(e.getOrderText())
                .build();
    }
}
