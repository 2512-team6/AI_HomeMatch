package com.homematch.domain.contract.entity;

import com.homematch.domain.contract.converter.StringListJsonConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "clause_analysis_results")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ClauseAnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clause_analysis_id")
    private Long clauseAnalysisId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @Column(name = "clause_index", nullable = false)
    private Integer clauseIndex;

    @Lob
    @Column(name = "clause_text", nullable = false)
    private String clauseText;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false)
    private ContractLevel level;

    @Column(name = "conclusion")
    private String conclusion;

    // JSON
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "risk_points", columnDefinition = "json")
    private List<String> riskPoints;

    // TEXT (주의: SQL이 TEXT이므로 List 말고 String으로 저장)
    @Lob
    @Column(name = "mediation_summaries")
    private String mediationSummaries;

    // JSON
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "mediation_case_ids", columnDefinition = "json")
    private List<String> mediationCaseIds;

    // TEXT
    @Lob
    @Column(name = "precedent_summaries")
    private String precedentSummaries;

    // JSON
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "precedent_case_ids", columnDefinition = "json")
    private List<String> precedentCaseIds;

    // JSON
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "precedent_evidence", columnDefinition = "json")
    private List<String> precedentEvidence;

    // TEXT
    @Lob
    @Column(name = "law_summaries")
    private String lawSummaries;

    // JSON
    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "law_ids", columnDefinition = "json")
    private List<String> lawIds;

    @Lob
    @Column(name = "recommended_clause_text")
    private String recommendedClauseText;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
