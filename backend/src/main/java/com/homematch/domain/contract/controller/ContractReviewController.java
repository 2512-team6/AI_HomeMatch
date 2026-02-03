package com.homematch.domain.contract.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homematch.domain.contract.dto.ContractReviewRequest;
import com.homematch.domain.contract.dto.ContractReviewResponse;
import com.homematch.domain.contract.service.ContractReviewService;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import com.homematch.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contract/review")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ContractReviewController {

    private final ContractReviewService contractReviewService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // 파일 업로드 디렉토리
    private static final String UPLOAD_DIR = "uploads/contracts/";

    // JWT 토큰에서 사용자 ID 추출 헬퍼 메서드
    private Integer getUserIdFromToken(String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                throw new IllegalArgumentException("토큰이 제공되지 않았습니다.");
            }
            
            if (!jwtTokenProvider.validateToken(token)) {
                throw new IllegalArgumentException("토큰이 만료되었거나 유효하지 않습니다.");
            }
            
            String email = jwtTokenProvider.getEmail(token);
            if (email == null || email.trim().isEmpty()) {
                throw new IllegalArgumentException("토큰에서 이메일을 추출할 수 없습니다.");
            }
            
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + email));
            
            return user.getUserNo();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("토큰 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 계약서 파일 업로드 및 특약 정보 저장
     * 여러 파일을 한 번에 업로드하여 하나의 레코드에 저장합니다.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadContractReview(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("specialTerms") String specialTermsJson) {
        try {
            // Authorization 헤더 확인
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"Authorization 헤더가 올바르지 않습니다.\"}");
            }
            
            String token = authHeader.replace("Bearer ", "").trim();
            if (token.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"토큰이 제공되지 않았습니다.\"}");
            }
            
            Integer userNo = getUserIdFromToken(token);
            
            // 파일이 비어있는지 확인
            if (files == null || files.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"파일이 제공되지 않았습니다.\"}");
            }
            
            // 모든 파일 저장
            List<String> filePaths = new java.util.ArrayList<>();
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String filePath = saveFile(file);
                    filePaths.add(filePath);
                }
            }
            
            if (filePaths.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"유효한 파일이 없습니다.\"}");
            }
            
            // specialTerms JSON 파싱
            ContractReviewRequest request = new ContractReviewRequest();
            try {
                List<String> specialTerms = objectMapper.readValue(
                    specialTermsJson, 
                    new TypeReference<List<String>>() {}
                );
                request.setSpecialTerms(specialTerms);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"특약 정보 형식이 올바르지 않습니다.\"}");
            }
            
            // DB 저장
            ContractReviewResponse response = contractReviewService.createContractReview(
                    userNo, filePaths, request);
            
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

    /**
     * 사용자의 모든 계약서 점검 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<ContractReviewResponse>> getContractReviews(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            List<ContractReviewResponse> reviews = contractReviewService.getContractReviews(userNo);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    /**
     * 특정 계약서 점검 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<ContractReviewResponse> getContractReview(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = getUserIdFromToken(token);
            ContractReviewResponse review = contractReviewService.getContractReview(userNo, id);
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    /**
     * 파일을 서버에 저장하고 경로 반환
     */
    private String saveFile(MultipartFile file) throws IOException {
        // 업로드 디렉토리 생성
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // 고유한 파일명 생성
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = UUID.randomUUID().toString() + extension;
        
        // 파일 저장
        Path filePath = uploadPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // 상대 경로 반환 (DB에 저장)
        return UPLOAD_DIR + uniqueFilename;
    }
}

