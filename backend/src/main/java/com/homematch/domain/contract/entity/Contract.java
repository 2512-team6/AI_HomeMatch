package com.homematch.domain.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "contracts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @Column(name = "contract_alias", nullable = false)
    private String contractAlias;

    @Column(name = "special_term_count", nullable = false)
    private Integer specialTermCount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // SQL에서 ON UPDATE CURRENT_TIMESTAMP로 갱신됨. JPA에서 굳이 관리 안 해도 읽기 가능.
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
