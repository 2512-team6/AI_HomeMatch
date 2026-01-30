package com.homematch.domain.residency;

import com.homematch.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "residency_agreement_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ResidencyAgreementRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_no", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defect_issue_id")
    private ResidencyDefectIssue defectIssue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Counterpart counterpart;

    @Enumerated(EnumType.STRING)
    @Column(name = "communication_type", nullable = false, length = 20)
    private CommunicationType communicationType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum Counterpart {
        LANDLORD,
        MANAGER
    }

    public enum CommunicationType {
        CALL,
        MESSAGE,
        VISIT
    }
}

