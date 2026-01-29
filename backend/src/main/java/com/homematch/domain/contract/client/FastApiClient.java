package com.homematch.domain.contract.client;

import com.homematch.domain.contract.dto.FastApiAnalyzeResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class FastApiClient {

    private final WebClient webClient;

    public FastApiClient(
            WebClient.Builder webClientBuilder,
            @Value("${fastapi.base-url}") String baseUrl
    ) {
        this.webClient = webClientBuilder
                .baseUrl(baseUrl)
                .build();
    }

    /**
     * FastAPI /analyze 단건 호출
     *
     * @param clause 분석할 특약 문장
     * @param strict JSON strict 모드 여부
     */
    public FastApiAnalyzeResponse analyzeClause(String clause, boolean strict) {
        Map<String, Object> body = new HashMap<>();
        body.put("clause_text", clause);
        body.put("strict", strict);

        try {
            return webClient.post()
                    .uri("/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(FastApiAnalyzeResponse.class)
                    .timeout(Duration.ofSeconds(60))
                    .block();

        } catch (WebClientResponseException e) {
            // FastAPI가 4xx/5xx를 준 경우
            throw new RuntimeException(
                    "FastAPI 호출 실패 - status=" + e.getStatusCode()
                            + ", body=" + e.getResponseBodyAsString(),
                    e
            );
        } catch (Exception e) {
            // 네트워크/타임아웃/기타
            throw new RuntimeException("FastAPI 호출 중 예외 발생", e);
        }
    }
}
