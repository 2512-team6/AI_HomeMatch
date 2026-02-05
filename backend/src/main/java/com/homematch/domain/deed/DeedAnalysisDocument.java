package com.homematch.domain.deed;

import com.homematch.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "deed_analysis_documents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DeedAnalysisDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_no", nullable = false)
    private User user;

    @Column(name = "source_filename", length = 255)
    private String sourceFilename;

    @Column(name = "source_mime_type", length = 100)
    private String sourceMimeType;

    /** images 폴더 내 상대 경로 (예: deed/1/123_filename.pdf). DB는 URL/경로만 저장, 파일은 images에 저장 */
    @Column(name = "source_file_path", length = 512)
    private String sourceFilePath;

    @Lob
    @Column(name = "source_file_blob", columnDefinition = "LONGBLOB")
    private byte[] sourceFileBlob;

    @Column(name = "source_file_size")
    private Long sourceFileSize;

    @Column(name = "extracted_text", columnDefinition = "LONGTEXT")
    private String extractedText;

    @Column(name = "structured_json", columnDefinition = "LONGTEXT")
    private String structuredJson;

    @Column(name = "sections_json", columnDefinition = "LONGTEXT")
    private String sectionsJson;

    @Column(name = "risk_flags_json", columnDefinition = "LONGTEXT")
    private String riskFlagsJson;

    @Column(name = "check_items_json", columnDefinition = "LONGTEXT")
    private String checkItemsJson;

    @Column(name = "explanation", columnDefinition = "LONGTEXT")
    private String explanation;

    @Column(name = "archived", nullable = false)
    @Builder.Default
    private Boolean archived = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }

    public void setSourceFilePath(String sourceFilePath) {
        this.sourceFilePath = sourceFilePath;
    }

    public void setSourceMimeType(String sourceMimeType) {
        this.sourceMimeType = sourceMimeType;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}

