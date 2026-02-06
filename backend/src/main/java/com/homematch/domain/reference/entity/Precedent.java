package com.homematch.domain.reference.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "precedents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Precedent {

    @Id
    @Column(name = "precedent_id", length = 32)
    private String precedentId;

    @Column(name = "case_name", nullable = false, length = 255)
    private String caseName;

    @Column(name = "case_number", nullable = false, length = 64)
    private String caseNumber;

    @Column(name = "decision_date", nullable = false)
    private LocalDate decisionDate;

    @Column(name = "decision_type", length = 16)
    private String decisionType;

    @Column(name = "court_name", length = 100)
    private String courtName;

    @Column(name = "case_type_name", length = 50)
    private String caseTypeName;

    @Column(name = "judgment_type", length = 50)
    private String judgmentType;

    @Lob
    @Column(name = "issues")
    private String issues;

    @Lob
    @Column(name = "summary")
    private String summary;

    @Lob
    @Column(name = "referenced_laws")
    private String referencedLaws;

    @Lob
    @Column(name = "referenced_cases")
    private String referencedCases;

    @Lob
    @Column(name = "full_text")
    private String fullText;
}
