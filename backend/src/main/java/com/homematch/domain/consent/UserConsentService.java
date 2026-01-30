package com.homematch.domain.consent;

import com.homematch.domain.consent.dto.ConsentAgreeRequest;
import com.homematch.domain.consent.dto.ConsentHistoryResponse;
import com.homematch.domain.consent.dto.ConsentRecordResponse;
import com.homematch.domain.consent.dto.ConsentStatusResponse;
import com.homematch.domain.consent.dto.ConsentWithdrawRequest;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserConsentService {

    private final UserConsentRepository userConsentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ConsentStatusResponse getConsentStatus(Integer userNo, List<String> requiredTypes, String version) {
        List<String> activeTypes = userConsentRepository.findActiveConsentTypes(userNo, version, requiredTypes);
        Set<String> activeSet = new HashSet<>(activeTypes);

        List<String> missing = new ArrayList<>();
        for (String t : requiredTypes) {
            if (!activeSet.contains(t)) {
                missing.add(t);
            }
        }

        return ConsentStatusResponse.builder()
                .hasAll(missing.isEmpty())
                .missingTypes(missing)
                .build();
    }

    @Transactional
    public void agree(Integer userNo, ConsentAgreeRequest request) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 같은 consentType에 대해 기존 활성 동의가 있으면 철회 처리 (이력 유지)
        List<UserConsent> active = userConsentRepository.findActiveByUserNoAndType(userNo, request.getConsentType());
        for (UserConsent c : active) {
            c.withdrawNow();
        }
        userConsentRepository.saveAll(active);

        String hash = sha256Hex(request.getConsentContent());

        UserConsent consent = UserConsent.builder()
                .user(user)
                .consentType(request.getConsentType())
                .consentContent(request.getConsentContent())
                .contentHash(hash)
                .version(request.getVersion())
                .build();

        userConsentRepository.save(consent);
    }

    @Transactional(readOnly = true)
    public ConsentHistoryResponse getMyConsentHistory(Integer userNo, String type, String version) {
        List<UserConsent> history = userConsentRepository.findHistoryByUserNo(userNo, type);

        UserConsent current = null;
        if (type != null && version != null) {
            List<UserConsent> active = userConsentRepository.findActiveByUserNoTypeAndVersion(userNo, type, version);
            if (!active.isEmpty()) current = active.get(0);
        } else if (type != null) {
            List<UserConsent> active = userConsentRepository.findActiveByUserNoAndType(userNo, type);
            if (!active.isEmpty()) {
                active.sort((a, b) -> b.getAgreedAt().compareTo(a.getAgreedAt()));
                current = active.get(0);
            }
        }

        ConsentRecordResponse currentRes = current == null ? null : toDto(current);
        List<ConsentRecordResponse> historyRes = history.stream().map(this::toDto).collect(Collectors.toList());

        return ConsentHistoryResponse.builder()
                .current(currentRes)
                .history(historyRes)
                .build();
    }

    @Transactional
    public boolean withdraw(Integer userNo, ConsentWithdrawRequest request) {
        if (request.getConsentType() == null || request.getConsentType().isBlank()) {
            throw new IllegalArgumentException("consentType이 필요합니다.");
        }

        List<UserConsent> active;
        if (request.getVersion() != null && !request.getVersion().isBlank()) {
            active = userConsentRepository.findActiveByUserNoTypeAndVersion(userNo, request.getConsentType(), request.getVersion());
        } else {
            active = userConsentRepository.findActiveByUserNoAndType(userNo, request.getConsentType());
        }

        if (active.isEmpty()) return false;

        for (UserConsent c : active) {
            c.withdrawNow();
        }
        userConsentRepository.saveAll(active);
        return true;
    }

    private ConsentRecordResponse toDto(UserConsent uc) {
        return ConsentRecordResponse.builder()
                .consentId(uc.getConsentId())
                .consentType(uc.getConsentType())
                .version(uc.getVersion())
                .contentHash(uc.getContentHash())
                .consentContent(uc.getConsentContent())
                .agreedAt(uc.getAgreedAt())
                .withdrawnAt(uc.getWithdrawnAt())
                .build();
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("해시 계산에 실패했습니다.", e);
        }
    }
}

