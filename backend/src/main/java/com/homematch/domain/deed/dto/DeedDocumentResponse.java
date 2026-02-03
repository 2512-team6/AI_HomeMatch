package com.homematch.domain.deed.dto;

import java.time.LocalDateTime;

public class DeedDocumentResponse {
    private Long id;
    private String sourceFilename;
    private String sourceMimeType;
    private Boolean archived;
    private LocalDateTime createdAt;

    // 요약용
    private String riskFlagsJson;

    public DeedDocumentResponse() {}

    public DeedDocumentResponse(Long id, String sourceFilename, String sourceMimeType, Boolean archived, LocalDateTime createdAt, String riskFlagsJson) {
        this.id = id;
        this.sourceFilename = sourceFilename;
        this.sourceMimeType = sourceMimeType;
        this.archived = archived;
        this.createdAt = createdAt;
        this.riskFlagsJson = riskFlagsJson;
    }

    public Long getId() { return id; }
    public String getSourceFilename() { return sourceFilename; }
    public String getSourceMimeType() { return sourceMimeType; }
    public Boolean getArchived() { return archived; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getRiskFlagsJson() { return riskFlagsJson; }
}

