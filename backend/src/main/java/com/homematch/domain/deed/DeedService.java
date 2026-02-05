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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;

@Service
@RequiredArgsConstructor
public class DeedService {

    private static final Pattern SAFE_FILENAME = Pattern.compile("[^a-zA-Z0-9._-]");

    @Value("${app.images.base-dir:images}")
    private String imagesBaseDir;

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

        // 1) DB에 메타 저장 (분석 결과 포함)
        DeedAnalysisDocument saved = repository.save(
                DeedAnalysisDocument.builder()
                        .user(user)
                        .sourceFilename(file.getOriginalFilename())
                        .sourceMimeType(file.getContentType())
                        .sourceFilePath(null)
                        .sourceFileBlob(null)
                        .sourceFileSize(null)
                        .extractedText(extractedText)
                        .structuredJson(structuredJson)
                        .sectionsJson(sectionsJson)
                        .riskFlagsJson(riskFlagsJson)
                        .checkItemsJson(checkItemsJson)
                        .explanation(explanation)
                        .archived(false)
                        .build()
        );

        // 2) images 폴더에 저장 (PDF는 이미지로 변환하여 저장)
        String relativePath;
        if (isPdf(file)) {
            relativePath = savePdfAsImageToImages(user.getUserNo(), saved.getId(), file);
            saved = repository.findById(saved.getId()).orElseThrow();
            saved.setSourceFilePath(relativePath);
            saved.setSourceMimeType("image/png");
        } else {
            relativePath = saveFileToImages(user.getUserNo(), saved.getId(), file);
            saved = repository.findById(saved.getId()).orElseThrow();
            saved.setSourceFilePath(relativePath);
        }
        repository.save(saved);

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

    /** DB 경로(source_file_path) 또는 기존 Blob에서 파일 바이트 반환. 없으면 null. */
    public byte[] getFileBytes(DeedAnalysisDocument doc) {
        if (doc.getSourceFilePath() != null && !doc.getSourceFilePath().isBlank()) {
            Path base = Paths.get(imagesBaseDir).toAbsolutePath();
            Path file = base.resolve(doc.getSourceFilePath());
            try {
                if (Files.exists(file)) return Files.readAllBytes(file);
            } catch (IOException ignored) { }
        }
        return doc.getSourceFileBlob();
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
        deleteFileIfExists(doc.getSourceFilePath());
        doc.softDelete();
        repository.save(doc);
    }

    private boolean isPdf(MultipartFile file) {
        String name = file.getOriginalFilename();
        String type = file.getContentType();
        if (type != null && type.toLowerCase().contains("pdf")) return true;
        if (name != null && name.toLowerCase().endsWith(".pdf")) return true;
        return false;
    }

    /** PDF 첫 페이지를 PNG 이미지로 변환하여 저장. 반환: 상대 경로 (예: deed/1/123.png) */
    private String savePdfAsImageToImages(Integer userId, Long docId, MultipartFile file) {
        String relativePath = "deed/" + userId + "/" + docId + ".png";
        Path base = Paths.get(imagesBaseDir).toAbsolutePath();
        Path target = base.resolve(relativePath);
        try {
            Files.createDirectories(target.getParent());
            byte[] pdfBytes = file.getBytes();
            try (PDDocument doc = PDDocument.load(new ByteArrayInputStream(pdfBytes))) {
                if (doc.getNumberOfPages() == 0) throw new RuntimeException("PDF에 페이지가 없습니다.");
                PDFRenderer renderer = new PDFRenderer(doc);
                BufferedImage image = renderer.renderImageWithDPI(0, 150);
                try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                    ImageIO.write(image, "PNG", out);
                    Files.write(target, out.toByteArray());
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("PDF를 이미지로 저장 실패: " + relativePath, e);
        }
        return relativePath;
    }

    /** images 폴더에 파일 저장. 반환: DB에 저장할 상대 경로 (예: deed/1/123_filename.pdf) */
    private String saveFileToImages(Integer userId, Long docId, MultipartFile file) {
        String rawName = file.getOriginalFilename();
        if (rawName == null || rawName.isBlank()) rawName = "file";
        String safeName = SAFE_FILENAME.matcher(rawName).replaceAll("_");
        if (safeName.length() > 200) safeName = safeName.substring(0, 200);
        String fileName = docId + "_" + safeName;
        String relativePath = "deed/" + userId + "/" + fileName;
        Path base = Paths.get(imagesBaseDir).toAbsolutePath();
        Path target = base.resolve(relativePath);
        try {
            Files.createDirectories(target.getParent());
            file.transferTo(target.toFile());
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 실패: " + relativePath, e);
        }
        return relativePath;
    }

    /** DB에 저장된 경로 기준으로 파일 삭제 (소프트 삭제 시 디스크 파일도 제거) */
    private void deleteFileIfExists(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) return;
        Path base = Paths.get(imagesBaseDir).toAbsolutePath();
        Path file = base.resolve(relativePath);
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) { }
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

