package com.homematch.domain.consent;

import com.homematch.domain.consent.dto.ConsentAgreeRequest;
import com.homematch.domain.consent.dto.ConsentHistoryResponse;
import com.homematch.domain.consent.dto.ConsentStatusResponse;
import com.homematch.domain.consent.dto.ConsentWithdrawRequest;
import com.homematch.domain.user.UserService;
import com.homematch.global.jwt.JwtTokenProvider;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/consents")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserConsentController {

    private static final Logger log = LoggerFactory.getLogger(UserConsentController.class);

    private final UserConsentService userConsentService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @PostConstruct
    public void init() {
        System.out.println("✅ UserConsentController loaded");
    }

    private String getEmailFromToken(String token) {
        try {
            return jwtTokenProvider.getEmail(token);
        } catch (Exception e) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }
    }

    private Integer getUserNoFromAuthHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증이 필요합니다.");
        }
        String token = authHeader.replace("Bearer ", "");
        String email = getEmailFromToken(token);
        return userService.getUserByEmail(email).getUserNo();
    }

    /* 필수 동의 충족 여부 조회 */
    @GetMapping("/required")
    public ResponseEntity<?> required(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("types") String types,
            @RequestParam("version") String version
    ) {
        try {
            Integer userNo = getUserNoFromAuthHeader(authHeader);
            List<String> requiredTypes = Arrays.stream(types.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());

            ConsentStatusResponse res = userConsentService.getConsentStatus(userNo, requiredTypes, version);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (MethodArgumentTypeMismatchException | HttpMessageNotReadableException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 형식이 올바르지 않습니다.");
        } catch (Exception e) {
            log.error("Consent required check failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildDevError("서버 오류로 동의 상태 확인에 실패했습니다.", e));
        }
    }

    /* 동의 저장 (이력) */
    @PostMapping("/agree")
    public ResponseEntity<?> agree(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody ConsentAgreeRequest request
    ) {
        try {
            Integer userNo = getUserNoFromAuthHeader(authHeader);
            userConsentService.agree(userNo, request);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            log.error("Consent agree failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildDevError("서버 오류로 동의 저장에 실패했습니다.", e));
        }
    }

    /* 내 동의 내역 조회 */
    @GetMapping("/me")
    public ResponseEntity<?> myConsents(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "version", required = false) String version
    ) {
        try {
            Integer userNo = getUserNoFromAuthHeader(authHeader);
            ConsentHistoryResponse res = userConsentService.getMyConsentHistory(userNo, type, version);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            log.error("Consent history failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildDevError("서버 오류로 동의 내역 조회에 실패했습니다.", e));
        }
    }

    /* 동의 철회 */
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody ConsentWithdrawRequest request
    ) {
        try {
            Integer userNo = getUserNoFromAuthHeader(authHeader);
            boolean changed = userConsentService.withdraw(userNo, request);
            if (!changed) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("철회할 활성 동의가 없습니다.");
            }
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            log.error("Consent withdraw failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildDevError("서버 오류로 동의 철회에 실패했습니다.", e));
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidation(MethodArgumentNotValidException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("필수 동의 정보가 누락되었습니다.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<String> handleJsonParse(HttpMessageNotReadableException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("요청 본문(JSON) 형식이 올바르지 않습니다.");
    }

    private static String buildDevError(String message, Exception e) {
        String detail = e.getClass().getSimpleName();
        if (e.getMessage() != null && !e.getMessage().isBlank()) {
            detail += ": " + e.getMessage();
        }
        return message + " (" + detail + ")";
    }
}

