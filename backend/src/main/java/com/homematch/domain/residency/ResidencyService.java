package com.homematch.domain.residency;

import com.homematch.domain.residency.dto.*;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ResidencyService {

    private final HousingContractRepository housingContractRepository;
    private final HousingCostSettingsRepository housingCostSettingsRepository;
    private final MonthlyHousingRecordRepository monthlyHousingRecordRepository;
    private final ResidencyDefectIssueRepository residencyDefectIssueRepository;
    private final ResidencyIssueTimelineRepository residencyIssueTimelineRepository;
    private final ResidencyAgreementRecordRepository residencyAgreementRecordRepository;
    private final UserRepository userRepository;

    // ========== Housing Contract ==========
    public HousingContractResponse getHousingContract(Integer userNo) {
        Optional<HousingContract> contract = housingContractRepository.findByUser_User_no(userNo);
        return contract.map(this::toHousingContractResponse).orElse(null);
    }

    public HousingContractResponse createOrUpdateHousingContract(Integer userNo, HousingContractRequest request) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 필수 필드 검증
        if (request.getContractStartDate() == null || request.getContractEndDate() == null) {
            throw new IllegalArgumentException("계약 시작일과 종료일은 필수입니다.");
        }

        // 종료일이 시작일보다 이후인지 확인
        if (request.getContractEndDate().isBefore(request.getContractStartDate()) ||
            request.getContractEndDate().isEqual(request.getContractStartDate())) {
            throw new IllegalArgumentException("계약 종료일은 시작일보다 이후여야 합니다.");
        }

        Optional<HousingContract> existing = housingContractRepository.findByUser_User_no(userNo);
        
        if (existing.isPresent()) {
            HousingContract contract = existing.get();
            contract.updateContractDates(request.getContractStartDate(), request.getContractEndDate());
            if (request.getContractDurationMonths() != null) {
                contract.updateContractDuration(request.getContractDurationMonths());
            }
            if (request.getNotes() != null) {
                contract.updateNotes(request.getNotes());
            }
            HousingContract saved = housingContractRepository.save(contract);
            return toHousingContractResponse(saved);
        } else {
            HousingContract contract = HousingContract.builder()
                    .user(user)
                    .contractStartDate(request.getContractStartDate())
                    .contractEndDate(request.getContractEndDate())
                    .contractDurationMonths(request.getContractDurationMonths())
                    .notes(request.getNotes())
                    .build();
            HousingContract saved = housingContractRepository.save(contract);
            return toHousingContractResponse(saved);
        }
    }

    private HousingContractResponse toHousingContractResponse(HousingContract contract) {
        return HousingContractResponse.builder()
                .id(contract.getId())
                .contractStartDate(contract.getContractStartDate())
                .contractEndDate(contract.getContractEndDate())
                .contractDurationMonths(contract.getContractDurationMonths())
                .notes(contract.getNotes())
                .build();
    }

    // ========== Housing Cost Settings ==========
    public HousingCostSettingsResponse getHousingCostSettings(Integer userNo) {
        Optional<HousingCostSettings> settings = housingCostSettingsRepository.findByUser_User_no(userNo);
        return settings.map(this::toHousingCostSettingsResponse).orElse(null);
    }

    public HousingCostSettingsResponse createOrUpdateHousingCostSettings(Integer userNo, HousingCostSettingsRequest request) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 납부일 유효성 검사
        if (request.getPaymentDate() < 1 || request.getPaymentDate() > 31) {
            throw new IllegalArgumentException("납부일은 1~31 사이여야 합니다.");
        }

        Optional<HousingCostSettings> existing = housingCostSettingsRepository.findByUser_User_no(userNo);

        if (existing.isPresent()) {
            HousingCostSettings settings = existing.get();
            settings = HousingCostSettings.builder()
                    .id(settings.getId())
                    .user(user)
                    .rent(request.getRent() != null ? request.getRent() : BigDecimal.ZERO)
                    .maintenance(request.getMaintenance() != null ? request.getMaintenance() : BigDecimal.ZERO)
                    .utilities(request.getUtilities() != null ? request.getUtilities() : BigDecimal.ZERO)
                    .paymentDate(request.getPaymentDate())
                    .autoRegister(request.getAutoRegister() != null ? request.getAutoRegister() : false)
                    .createdAt(settings.getCreatedAt())
                    .build();
            HousingCostSettings saved = housingCostSettingsRepository.save(settings);
            return toHousingCostSettingsResponse(saved);
        } else {
            HousingCostSettings settings = HousingCostSettings.builder()
                    .user(user)
                    .rent(request.getRent() != null ? request.getRent() : BigDecimal.ZERO)
                    .maintenance(request.getMaintenance() != null ? request.getMaintenance() : BigDecimal.ZERO)
                    .utilities(request.getUtilities() != null ? request.getUtilities() : BigDecimal.ZERO)
                    .paymentDate(request.getPaymentDate())
                    .autoRegister(request.getAutoRegister() != null ? request.getAutoRegister() : false)
                    .build();
            HousingCostSettings saved = housingCostSettingsRepository.save(settings);
            return toHousingCostSettingsResponse(saved);
        }
    }

    private HousingCostSettingsResponse toHousingCostSettingsResponse(HousingCostSettings settings) {
        return HousingCostSettingsResponse.builder()
                .id(settings.getId())
                .rent(settings.getRent())
                .maintenance(settings.getMaintenance())
                .utilities(settings.getUtilities())
                .paymentDate(settings.getPaymentDate())
                .autoRegister(settings.getAutoRegister())
                .build();
    }

    // ========== Monthly Housing Records ==========
    public List<MonthlyHousingRecordResponse> getMonthlyHousingRecords(Integer userNo) {
        List<MonthlyHousingRecord> records = monthlyHousingRecordRepository.findByUser_User_noOrderByYearDescMonthDesc(userNo);
        return records.stream()
                .map(this::toMonthlyHousingRecordResponse)
                .collect(Collectors.toList());
    }

    public List<MonthlyHousingRecordResponse> getMonthlyHousingRecordsByYear(Integer userNo, Integer year) {
        List<MonthlyHousingRecord> records = monthlyHousingRecordRepository.findByUser_User_noAndYearOrderByMonthDesc(userNo, year);
        return records.stream()
                .map(this::toMonthlyHousingRecordResponse)
                .collect(Collectors.toList());
    }

    public MonthlyHousingRecordResponse getMonthlyHousingRecord(Integer userNo, Integer year, Integer month) {
        Optional<MonthlyHousingRecord> record = monthlyHousingRecordRepository.findByUser_User_noAndYearAndMonth(userNo, year, month);
        return record.map(this::toMonthlyHousingRecordResponse).orElse(null);
    }

    public MonthlyHousingRecordResponse createOrUpdateMonthlyHousingRecord(Integer userNo, MonthlyHousingRecordRequest request) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 유효성 검사
        if (request.getMonth() < 1 || request.getMonth() > 12) {
            throw new IllegalArgumentException("월은 1~12 사이여야 합니다.");
        }
        if (request.getPaymentDate() < 1 || request.getPaymentDate() > 31) {
            throw new IllegalArgumentException("납부일은 1~31 사이여야 합니다.");
        }

        Optional<MonthlyHousingRecord> existing = monthlyHousingRecordRepository.findByUser_User_noAndYearAndMonth(
                userNo, request.getYear(), request.getMonth());

        if (existing.isPresent()) {
            MonthlyHousingRecord record = existing.get();
            record = MonthlyHousingRecord.builder()
                    .id(record.getId())
                    .user(user)
                    .year(request.getYear())
                    .month(request.getMonth())
                    .rent(request.getRent() != null ? request.getRent() : BigDecimal.ZERO)
                    .maintenance(request.getMaintenance() != null ? request.getMaintenance() : BigDecimal.ZERO)
                    .utilities(request.getUtilities() != null ? request.getUtilities() : BigDecimal.ZERO)
                    .paymentDate(request.getPaymentDate())
                    .paid(request.getPaid() != null ? request.getPaid() : false)
                    .paidAt(request.getPaid() != null && request.getPaid() ? LocalDateTime.now() : null)
                    .notes(request.getNotes())
                    .createdAt(record.getCreatedAt())
                    .build();
            MonthlyHousingRecord saved = monthlyHousingRecordRepository.save(record);
            return toMonthlyHousingRecordResponse(saved);
        } else {
            MonthlyHousingRecord record = MonthlyHousingRecord.builder()
                    .user(user)
                    .year(request.getYear())
                    .month(request.getMonth())
                    .rent(request.getRent() != null ? request.getRent() : BigDecimal.ZERO)
                    .maintenance(request.getMaintenance() != null ? request.getMaintenance() : BigDecimal.ZERO)
                    .utilities(request.getUtilities() != null ? request.getUtilities() : BigDecimal.ZERO)
                    .paymentDate(request.getPaymentDate())
                    .paid(request.getPaid() != null ? request.getPaid() : false)
                    .paidAt(request.getPaid() != null && request.getPaid() ? LocalDateTime.now() : null)
                    .notes(request.getNotes())
                    .build();
            MonthlyHousingRecord saved = monthlyHousingRecordRepository.save(record);
            return toMonthlyHousingRecordResponse(saved);
        }
    }

    public void deleteMonthlyHousingRecord(Integer userNo, Long id) {
        MonthlyHousingRecord record = monthlyHousingRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));

        if (!record.getUser().getUserNo().equals(userNo)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        monthlyHousingRecordRepository.delete(record);
    }

    private MonthlyHousingRecordResponse toMonthlyHousingRecordResponse(MonthlyHousingRecord record) {
        return MonthlyHousingRecordResponse.builder()
                .id(record.getId())
                .year(record.getYear())
                .month(record.getMonth())
                .rent(record.getRent())
                .maintenance(record.getMaintenance())
                .utilities(record.getUtilities())
                .paymentDate(record.getPaymentDate())
                .paid(record.getPaid())
                .paidAt(record.getPaidAt())
                .notes(record.getNotes())
                .build();
    }

    // ========== Residency Defect Issues ==========
    public List<ResidencyDefectIssueResponse> getResidencyDefectIssues(Integer userNo) {
        List<ResidencyDefectIssue> issues = residencyDefectIssueRepository.findByUser_User_noOrderByIssueDateDesc(userNo);
        return issues.stream()
                .map(this::toResidencyDefectIssueResponse)
                .collect(Collectors.toList());
    }

    public List<ResidencyDefectIssueResponse> getResidencyDefectIssuesByStatus(Integer userNo, ResidencyDefectIssue.IssueStatus status) {
        List<ResidencyDefectIssue> issues = residencyDefectIssueRepository.findByUser_User_noAndStatusOrderByIssueDateDesc(userNo, status);
        return issues.stream()
                .map(this::toResidencyDefectIssueResponse)
                .collect(Collectors.toList());
    }

    public ResidencyDefectIssueResponse createResidencyDefectIssue(Integer userNo, ResidencyDefectIssueRequest request) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ResidencyDefectIssue issue = ResidencyDefectIssue.builder()
                .user(user)
                .title(request.getTitle())
                .imageUrl(request.getImageUrl())
                .issueDate(request.getIssueDate())
                .status(request.getStatus() != null ? request.getStatus() : ResidencyDefectIssue.IssueStatus.RECEIVED)
                .riskLevel(request.getRiskLevel())
                .memo(request.getMemo())
                .build();

        ResidencyDefectIssue saved = residencyDefectIssueRepository.save(issue);
        appendTimelineIfNotDuplicate(saved, ResidencyIssueTimeline.EventType.CREATED, null);
        return toResidencyDefectIssueResponse(saved);
    }

    public ResidencyDefectIssueResponse updateResidencyDefectIssue(Integer userNo, Long id, ResidencyDefectIssueRequest request) {
        ResidencyDefectIssue issue = residencyDefectIssueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("이슈를 찾을 수 없습니다."));

        if (!issue.getUser().getUserNo().equals(userNo)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        ResidencyDefectIssue.IssueStatus previousStatus = issue.getStatus();
        ResidencyDefectIssue.IssueStatus nextStatus = request.getStatus() != null ? request.getStatus() : issue.getStatus();

        issue = ResidencyDefectIssue.builder()
                .id(issue.getId())
                .user(issue.getUser())
                .title(request.getTitle() != null ? request.getTitle() : issue.getTitle())
                .imageUrl(request.getImageUrl() != null ? request.getImageUrl() : issue.getImageUrl())
                .issueDate(request.getIssueDate() != null ? request.getIssueDate() : issue.getIssueDate())
                .status(nextStatus)
                .riskLevel(request.getRiskLevel() != null ? request.getRiskLevel() : issue.getRiskLevel())
                .lastNotifiedAt(issue.getLastNotifiedAt())
                .memo(request.getMemo() != null ? request.getMemo() : issue.getMemo())
                .createdAt(issue.getCreatedAt())
                .build();

        ResidencyDefectIssue saved = residencyDefectIssueRepository.save(issue);

        if (previousStatus != ResidencyDefectIssue.IssueStatus.COMPLETED
                && saved.getStatus() == ResidencyDefectIssue.IssueStatus.COMPLETED) {
            appendTimelineIfNotDuplicate(saved, ResidencyIssueTimeline.EventType.COMPLETED, null);
        }

        return toResidencyDefectIssueResponse(saved);
    }

    public void deleteResidencyDefectIssue(Integer userNo, Long id) {
        ResidencyDefectIssue issue = residencyDefectIssueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("이슈를 찾을 수 없습니다."));

        if (!issue.getUser().getUserNo().equals(userNo)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        residencyDefectIssueRepository.delete(issue);
    }

    private ResidencyDefectIssueResponse toResidencyDefectIssueResponse(ResidencyDefectIssue issue) {
        return ResidencyDefectIssueResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .imageUrl(issue.getImageUrl())
                .issueDate(issue.getIssueDate())
                .status(issue.getStatus())
                .riskLevel(issue.getRiskLevel())
                .lastNotifiedAt(issue.getLastNotifiedAt())
                .memo(issue.getMemo())
                .build();
    }

    // ========== Defect Issue Timelines ==========
    public List<ResidencyIssueTimelineResponse> getDefectIssueTimelines(Integer userNo, Long defectIssueId) {
        ResidencyDefectIssue issue = residencyDefectIssueRepository.findById(defectIssueId)
                .orElseThrow(() -> new IllegalArgumentException("이슈를 찾을 수 없습니다."));

        if (!issue.getUser().getUserNo().equals(userNo)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        List<ResidencyIssueTimeline> timelines = residencyIssueTimelineRepository
                .findByDefectIssue_IdOrderByCreatedAtDescIdDesc(defectIssueId);

        return timelines.stream()
                .map(this::toResidencyIssueTimelineResponse)
                .collect(Collectors.toList());
    }

    public ResidencyIssueTimelineResponse createDefectIssueTimeline(Integer userNo, Long defectIssueId, ResidencyIssueTimelineRequest request) {
        if (request.getEventType() == null) {
            throw new IllegalArgumentException("eventType은 필수입니다.");
        }

        ResidencyDefectIssue issue = residencyDefectIssueRepository.findById(defectIssueId)
                .orElseThrow(() -> new IllegalArgumentException("이슈를 찾을 수 없습니다."));

        if (!issue.getUser().getUserNo().equals(userNo)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        if (request.getEventType() == ResidencyIssueTimeline.EventType.NOTIFIED) {
            issue.updateLastNotifiedAt(LocalDateTime.now());
            residencyDefectIssueRepository.save(issue);
        }

        ResidencyIssueTimeline created = appendTimelineIfNotDuplicate(issue, request.getEventType(), request.getNote());
        if (created == null) {
            // 연속 중복인 경우: 마지막 이벤트를 그대로 반환
            ResidencyIssueTimeline last = residencyIssueTimelineRepository
                    .findTopByDefectIssue_IdOrderByCreatedAtDescIdDesc(defectIssueId)
                    .orElseThrow(() -> new IllegalArgumentException("타임라인을 생성할 수 없습니다."));
            return toResidencyIssueTimelineResponse(last);
        }

        return toResidencyIssueTimelineResponse(created);
    }

    private ResidencyIssueTimelineResponse toResidencyIssueTimelineResponse(ResidencyIssueTimeline timeline) {
        return ResidencyIssueTimelineResponse.builder()
                .id(timeline.getId())
                .defectIssueId(timeline.getDefectIssue().getId())
                .eventType(timeline.getEventType())
                .note(timeline.getNote())
                .createdAt(timeline.getCreatedAt())
                .build();
    }

    /**
     * 동일 이슈에 대해 같은 eventType이 "연속"으로 중복 저장되지 않게 방지.
     * (마지막 이벤트가 동일하면 skip)
     *
     * @return 생성된 타임라인(스킵되면 null)
     */
    private ResidencyIssueTimeline appendTimelineIfNotDuplicate(ResidencyDefectIssue issue,
                                                               ResidencyIssueTimeline.EventType eventType,
                                                               String note) {
        Optional<ResidencyIssueTimeline> last = residencyIssueTimelineRepository
                .findTopByDefectIssue_IdOrderByCreatedAtDescIdDesc(issue.getId());

        if (last.isPresent() && last.get().getEventType() == eventType) {
            return null;
        }

        ResidencyIssueTimeline timeline = ResidencyIssueTimeline.builder()
                .defectIssue(issue)
                .eventType(eventType)
                .note(note)
                .build();

        return residencyIssueTimelineRepository.save(timeline);
    }

    // ========== Agreement Records ==========
    public List<ResidencyAgreementRecordResponse> getAgreementRecords(Integer userNo, Integer limit) {
        int pageSize = (limit == null || limit <= 0) ? 10 : Math.min(limit, 50);
        List<ResidencyAgreementRecord> records = residencyAgreementRecordRepository
                .findRecentByUserNo(userNo, PageRequest.of(0, pageSize));

        return records.stream()
                .map(this::toResidencyAgreementRecordResponse)
                .collect(Collectors.toList());
    }

    public ResidencyAgreementRecordResponse createAgreementRecord(Integer userNo, ResidencyAgreementRecordRequest request) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (request.getCounterpart() == null) {
            throw new IllegalArgumentException("counterpart는 필수입니다.");
        }
        if (request.getCommunicationType() == null) {
            throw new IllegalArgumentException("communicationType은 필수입니다.");
        }
        if (request.getSummary() == null || request.getSummary().trim().isEmpty()) {
            throw new IllegalArgumentException("summary는 필수입니다.");
        }

        ResidencyDefectIssue linkedIssue = null;
        if (request.getDefectIssueId() != null) {
            ResidencyDefectIssue issue = residencyDefectIssueRepository.findById(request.getDefectIssueId())
                    .orElseThrow(() -> new IllegalArgumentException("연결할 이슈를 찾을 수 없습니다."));
            if (!issue.getUser().getUserNo().equals(userNo)) {
                throw new IllegalArgumentException("권한이 없습니다.");
            }
            linkedIssue = issue;
        }

        ResidencyAgreementRecord record = ResidencyAgreementRecord.builder()
                .user(user)
                .defectIssue(linkedIssue)
                .counterpart(request.getCounterpart())
                .communicationType(request.getCommunicationType())
                .summary(request.getSummary().trim())
                .build();

        ResidencyAgreementRecord saved = residencyAgreementRecordRepository.save(record);
        return toResidencyAgreementRecordResponse(saved);
    }

    private ResidencyAgreementRecordResponse toResidencyAgreementRecordResponse(ResidencyAgreementRecord record) {
        return ResidencyAgreementRecordResponse.builder()
                .id(record.getId())
                .defectIssueId(record.getDefectIssue() != null ? record.getDefectIssue().getId() : null)
                .counterpart(record.getCounterpart())
                .communicationType(record.getCommunicationType())
                .summary(record.getSummary())
                .createdAt(record.getCreatedAt())
                .build();
    }
}
