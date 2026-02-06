package com.homematch.domain.reference.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "law_text")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LawText {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "source_year", nullable = false)
    private Integer sourceYear;

    @Column(name = "source_name", nullable = false, length = 200)
    private String sourceName;

    @Column(name = "source_doc", nullable = false, length = 255)
    private String sourceDoc;

    @Column(name = "page_start", nullable = false)
    private Integer pageStart;

    @Column(name = "page_end", nullable = false)
    private Integer pageEnd;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Lob
    @Column(name = "text", nullable = false)
    private String text;
}
