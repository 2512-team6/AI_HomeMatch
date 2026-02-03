package com.homematch.domain.deed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homematch.domain.deed.client.DeedFastApiClient;
import com.homematch.domain.deed.dto.DeedDocumentDetailResponse;
import com.homematch.domain.deed.dto.DeedDocumentResponse;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import com.homematch.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeedService {

    private final DeedFastApiClient deedFastApiClient;
    private final DeedAnalysisDocumentRepository repository;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Integer getUserIdFromToken(String token) {
        try {
            String email = jwtTokenProvider.getEmail(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            return user.getUserNo();
        } catch (Exception e) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }
    }

    public DeedDocumentDetailResponse analyzeAndSave(Integer userNo, MultipartFile file) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        JsonNode upload = deedFastApiClient.upload(file);
        long fastapiDocumentId = upload.path("document_id").asLong();
        String extractedText = upload.path("extracted_text").asText("");
        JsonNode sections = upload.path("sections");
        String sectionsJson = sections.isMissingNode() ? null : sections.toString();

        JsonNode risk = deedFastApiClient.riskAnalysis(fastapiDocumentId);
        JsonNode structured = risk.path("structured");
        String structuredJson = structured.isMissingNode() ? null : structured.toString();
        String riskFlagsJson = risk.path("risk_flags").isMissingNode() ? null : risk.path("risk_flags").toString();
        String checkItemsJson = risk.path("check_items").isMissingNode() ? null : risk.path("check_items").toString();
        String explanation = risk.path("explanation").asText(null);

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("업로드 파일 바이트 읽기 실패", e);
        }

        DeedAnalysisDocument saved = repository.save(
                DeedAnalysisDocument.builder()
                        .user(user)
                        .sourceFilename(file.getOriginalFilename())
                        .sourceMimeType(file.getContentType())
                        .sourceFileBlob(fileBytes)
                        .sourceFileSize((long) fileBytes.length)
                        .extractedText(extractedText)
                        .structuredJson(structuredJson)
                        .sectionsJson(sectionsJson)
                        .riskFlagsJson(riskFlagsJson)
                        .checkItemsJson(checkItemsJson)
                        .explanation(explanation)
                        .archived(false)
                        .build()
        );

        return toDetailResponse(saved);
    }

    public List<DeedDocumentResponse> list(Integer userNo, Boolean archived) {
        return repository.findByUserAndArchived(userNo, archived).stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    public DeedDocumentDetailResponse getOne(Integer userNo, Long id) {
        DeedAnalysisDocument doc = repository.findOneForUser(id, userNo)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));
        return toDetailResponse(doc);
    }

    public DeedAnalysisDocument getEntityForFile(Integer userNo, Long id) {
        return repository.findOneForUser(id, userNo)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));
    }

    public void setArchived(Integer userNo, Long id, boolean archived) {
        DeedAnalysisDocument doc = repository.findOneForUser(id, userNo)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));
        doc.setArchived(archived);
        repository.save(doc);
    }

    public void delete(Integer userNo, Long id) {
        DeedAnalysisDocument doc = repository.findOneForUser(id, userNo)
                .orElseThrow(() -> new IllegalArgumentException("문서를 찾을 수 없습니다."));
        doc.softDelete();
        repository.save(doc);
    }

    private DeedDocumentResponse toListResponse(DeedAnalysisDocument d) {
        return new DeedDocumentResponse(
                d.getId(),
                d.getSourceFilename(),
                d.getSourceMimeType(),
                d.getArchived(),
                d.getCreatedAt(),
                d.getRiskFlagsJson()
        );
    }

    private DeedDocumentDetailResponse toDetailResponse(DeedAnalysisDocument d) {
        return new DeedDocumentDetailResponse(
                d.getId(),
                d.getSourceFilename(),
                d.getSourceMimeType(),
                d.getArchived(),
                d.getCreatedAt(),
                d.getExtractedText(),
                d.getStructuredJson(),
                d.getSectionsJson(),
                d.getRiskFlagsJson(),
                d.getCheckItemsJson(),
                d.getExplanation()
        );
    }
}

