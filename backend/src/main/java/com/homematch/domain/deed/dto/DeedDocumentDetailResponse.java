package com.homematch.domain.deed.dto;

import java.time.LocalDateTime;

public class DeedDocumentDetailResponse {
    private Long id;
    private String sourceFilename;
    private String sourceMimeType;
    private Boolean archived;
    private LocalDateTime createdAt;

    private String extractedText;
    private String structuredJson;
    private String sectionsJson;
    private String riskFlagsJson;
    private String checkItemsJson;
    private String explanation;

    public DeedDocumentDetailResponse() {}

    public DeedDocumentDetailResponse(
            Long id,
            String sourceFilename,
            String sourceMimeType,
            Boolean archived,
            LocalDateTime createdAt,
            String extractedText,
            String structuredJson,
            String sectionsJson,
            String riskFlagsJson,
            String checkItemsJson,
            String explanation
    ) {
        this.id = id;
        this.sourceFilename = sourceFilename;
        this.sourceMimeType = sourceMimeType;
        this.archived = archived;
        this.createdAt = createdAt;
        this.extractedText = extractedText;
        this.structuredJson = structuredJson;
        this.sectionsJson = sectionsJson;
        this.riskFlagsJson = riskFlagsJson;
        this.checkItemsJson = checkItemsJson;
        this.explanation = explanation;
    }

    public Long getId() { return id; }
    public String getSourceFilename() { return sourceFilename; }
    public String getSourceMimeType() { return sourceMimeType; }
    public Boolean getArchived() { return archived; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getExtractedText() { return extractedText; }
    public String getStructuredJson() { return structuredJson; }
    public String getSectionsJson() { return sectionsJson; }
    public String getRiskFlagsJson() { return riskFlagsJson; }
    public String getCheckItemsJson() { return checkItemsJson; }
    public String getExplanation() { return explanation; }
}

