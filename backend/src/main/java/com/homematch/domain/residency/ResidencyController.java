package com.homematch.domain.residency;

import com.homematch.domain.residency.dto.*;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import com.homematch.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/residency")
@RequiredArgsConstructor
public class ResidencyController {

    private final ResidencyService residencyService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    // JWT 토큰에서 사용자 ID 추출 헬퍼 메서드
    private Integer getUserIdFromToken(String token) {
        try {
            // 토큰이 비어있는지 확인
            if (token == null || token.trim().isEmpty()) {
                throw new IllegalArgumentException("토큰이 제공되지 않았습니다.");
            }
            
            // 토큰 유효성 검증
            if (!jwtTokenProvider.validateToken(token)) {
                throw new IllegalArgumentException("토큰이 만료되었거나 유효하지 않습니다.");
            }
            
            // 이메일 추출
            String email = jwtTokenProvider.getEmail(token);
            if (email == null || email.trim().isEmpty()) {
                throw new IllegalArgumentException("토큰에서 이메일을 추출할 수 없습니다.");
            }
            
            // 사용자 조회
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
            
            return user.getUserNo();
        } catch (IllegalArgumentException e) {
            // IllegalArgumentException은 그대로 전달
            throw e;
        } catch (Exception e) {
            // 기타 예외는 로깅 후 일반적인 메시지로 변환
            e.printStackTrace();
            throw new IllegalArgumentException("토큰 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // ========== Housing Contract ==========
    @GetMapping("/contract")
    public ResponseEntity<HousingContractResponse> getHousingContract(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            HousingContractResponse response = residencyService.getHousingContract(userNo);
            if (response == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/contract")
    public ResponseEntity<?> createOrUpdateHousingContract(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody HousingContractRequest request) {
        try {
            // Authorization 헤더 확인
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"Authorization 헤더가 올바르지 않습니다.\"}");
            }
            
            String token = authHeader.replace("Bearer ", "").trim();
            
            // 토큰이 비어있는지 확인
            if (token.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"토큰이 제공되지 않았습니다.\"}");
            }
            
            Integer userNo = getUserIdFromToken(token);
            HousingContractResponse response = residencyService.createOrUpdateHousingContract(userNo, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"서버 오류가 발생했습니다: " + e.getMessage() + "\"}");
        }
    }

    // ========== Housing Cost Settings ==========
    @GetMapping("/cost-settings")
    public ResponseEntity<HousingCostSettingsResponse> getHousingCostSettings(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            HousingCostSettingsResponse response = residencyService.getHousingCostSettings(userNo);
            if (response == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/cost-settings")
    public ResponseEntity<HousingCostSettingsResponse> createOrUpdateHousingCostSettings(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody HousingCostSettingsRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            HousingCostSettingsResponse response = residencyService.createOrUpdateHousingCostSettings(userNo, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // ========== Monthly Housing Records ==========
    @GetMapping("/monthly-records")
    public ResponseEntity<List<MonthlyHousingRecordResponse>> getMonthlyHousingRecords(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            List<MonthlyHousingRecordResponse> records = residencyService.getMonthlyHousingRecords(userNo);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/monthly-records/{year}")
    public ResponseEntity<List<MonthlyHousingRecordResponse>> getMonthlyHousingRecordsByYear(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer year) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            List<MonthlyHousingRecordResponse> records = residencyService.getMonthlyHousingRecordsByYear(userNo, year);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @GetMapping("/monthly-records/{year}/{month}")
    public ResponseEntity<MonthlyHousingRecordResponse> getMonthlyHousingRecord(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Integer year,
            @PathVariable Integer month) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            MonthlyHousingRecordResponse record = residencyService.getMonthlyHousingRecord(userNo, year, month);
            if (record == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/monthly-records")
    public ResponseEntity<MonthlyHousingRecordResponse> createOrUpdateMonthlyHousingRecord(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody MonthlyHousingRecordRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            MonthlyHousingRecordResponse response = residencyService.createOrUpdateMonthlyHousingRecord(userNo, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @DeleteMapping("/monthly-records/{id}")
    public ResponseEntity<Void> deleteMonthlyHousingRecord(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            residencyService.deleteMonthlyHousingRecord(userNo, id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // ========== Residency Defect Issues ==========
    @GetMapping("/defect-issues")
    public ResponseEntity<List<ResidencyDefectIssueResponse>> getResidencyDefectIssues(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String status) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            List<ResidencyDefectIssueResponse> issues;
            
            if (status != null && !status.isEmpty()) {
                try {
                    ResidencyDefectIssue.IssueStatus issueStatus = ResidencyDefectIssue.IssueStatus.valueOf(status.toUpperCase());
                    issues = residencyService.getResidencyDefectIssuesByStatus(userNo, issueStatus);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
                }
            } else {
                issues = residencyService.getResidencyDefectIssues(userNo);
            }
            
            return ResponseEntity.ok(issues);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/defect-issues")
    public ResponseEntity<?> createResidencyDefectIssue(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ResidencyDefectIssueRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            ResidencyDefectIssueResponse response = residencyService.createResidencyDefectIssue(userNo, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"서버 오류가 발생했습니다: " + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/defect-issues/{id}")
    public ResponseEntity<?> updateResidencyDefectIssue(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody ResidencyDefectIssueRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            ResidencyDefectIssueResponse response = residencyService.updateResidencyDefectIssue(userNo, id, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"서버 오류가 발생했습니다: " + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/defect-issues/{id}")
    public ResponseEntity<Void> deleteResidencyDefectIssue(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            residencyService.deleteResidencyDefectIssue(userNo, id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // ========== Defect Issue Timelines ==========
    @GetMapping("/defect-issues/{id}/timelines")
    public ResponseEntity<List<ResidencyIssueTimelineResponse>> getDefectIssueTimelines(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            List<ResidencyIssueTimelineResponse> timelines = residencyService.getDefectIssueTimelines(userNo, id);
            return ResponseEntity.ok(timelines);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/defect-issues/{id}/timelines")
    public ResponseEntity<?> createDefectIssueTimeline(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody ResidencyIssueTimelineRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            ResidencyIssueTimelineResponse response = residencyService.createDefectIssueTimeline(userNo, id, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"서버 오류가 발생했습니다: " + e.getMessage() + "\"}");
        }
    }

    // ========== Agreement Records ==========
    @GetMapping("/agreement-records")
    public ResponseEntity<List<ResidencyAgreementRecordResponse>> getAgreementRecords(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Integer limit) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            List<ResidencyAgreementRecordResponse> records = residencyService.getAgreementRecords(userNo, limit);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/agreement-records")
    public ResponseEntity<?> createAgreementRecord(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ResidencyAgreementRecordRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            ResidencyAgreementRecordResponse response = residencyService.createAgreementRecord(userNo, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"서버 오류가 발생했습니다: " + e.getMessage() + "\"}");
        }
    }
}
