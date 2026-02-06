package com.homematch.domain.reference.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mediation_cases")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MediationCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "case_id")
    private Integer caseId;

    @Column(name = "source_year", nullable = false)
    private Integer sourceYear;

    @Column(name = "source_name", nullable = false, length = 300)
    private String sourceName;

    @Column(name = "source_doc", nullable = false, length = 300)
    private String sourceDoc;

    @Column(name = "page_start", nullable = false)
    private Integer pageStart;

    @Column(name = "page_end", nullable = false)
    private Integer pageEnd;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Lob
    @Column(name = "facts", nullable = false)
    private String facts;

    @Lob
    @Column(name = "issues")
    private String issues;

    @Lob
    @Column(name = "related_rules")
    private String relatedRules;

    @Lob
    @Column(name = "related_precedents")
    private String relatedPrecedents;

    @Lob
    @Column(name = "result")
    private String result;

    @Lob
    @Column(name = "order_text")
    private String orderText;
}
