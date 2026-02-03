package com.homematch.domain.contract.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homematch.domain.contract.ContractReview;
import com.homematch.domain.contract.ContractReviewRepository;
import com.homematch.domain.contract.dto.ContractReviewRequest;
import com.homematch.domain.contract.dto.ContractReviewResponse;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContractReviewService {

    private final ContractReviewRepository contractReviewRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public ContractReviewResponse createContractReview(
            Integer userNo,
            List<String> filePaths,
            ContractReviewRequest request
    ) {
        User user = userRepository.findByUserNo(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // filePaths를 JSON 문자열로 변환
        String filePathsJson;
        try {
            filePathsJson = objectMapper.writeValueAsString(filePaths);
        } catch (Exception e) {
            throw new IllegalArgumentException("파일 경로를 저장할 수 없습니다.", e);
        }

        // specialTerms를 JSON 문자열로 변환
        String specialTermsJson;
        try {
            specialTermsJson = objectMapper.writeValueAsString(request.getSpecialTerms());
        } catch (Exception e) {
            throw new IllegalArgumentException("특약 정보를 저장할 수 없습니다.", e);
        }

        ContractReview contractReview = ContractReview.builder()
                .user(user)
                .filePaths(filePathsJson)
                .specialTerms(specialTermsJson)
                .build();

        ContractReview saved = contractReviewRepository.save(contractReview);
        return toResponse(saved);
    }

    public List<ContractReviewResponse> getContractReviews(Integer userNo) {
        List<ContractReview> reviews = contractReviewRepository.findByUserNo(userNo);
        return reviews.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ContractReviewResponse getContractReview(Integer userNo, Long id) {
        ContractReview review = contractReviewRepository.findByUserNoAndId(userNo, id)
                .orElseThrow(() -> new IllegalArgumentException("계약서 점검을 찾을 수 없습니다."));
        return toResponse(review);
    }

    private ContractReviewResponse toResponse(ContractReview review) {
        // filePaths JSON 문자열을 List<String>으로 변환
        List<String> filePaths;
        try {
            if (review.getFilePaths() != null && !review.getFilePaths().isEmpty()) {
                filePaths = objectMapper.readValue(
                        review.getFilePaths(),
                        new TypeReference<List<String>>() {}
                );
            } else {
                filePaths = List.of();
            }
        } catch (Exception e) {
            filePaths = List.of();
        }

        // specialTerms JSON 문자열을 List<String>으로 변환
        List<String> specialTerms;
        try {
            if (review.getSpecialTerms() != null && !review.getSpecialTerms().isEmpty()) {
                specialTerms = objectMapper.readValue(
                        review.getSpecialTerms(),
                        new TypeReference<List<String>>() {}
                );
            } else {
                specialTerms = List.of();
            }
        } catch (Exception e) {
            specialTerms = List.of();
        }

        return ContractReviewResponse.builder()
                .id(review.getId())
                .filePaths(filePaths)
                .specialTerms(specialTerms)
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}

