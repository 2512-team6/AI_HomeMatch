package com.homematch.domain.deed.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

@Component
public class DeedFastApiClient {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final boolean enabled;

    public DeedFastApiClient(
            WebClient.Builder webClientBuilder,
            @Value("${fastapi.base-url:}") String baseUrl
    ) {
        this.enabled = baseUrl != null && !baseUrl.isBlank();
        this.webClient = enabled ? webClientBuilder.baseUrl(baseUrl).build() : null;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public JsonNode upload(MultipartFile file) {
        if (!enabled) throw new FastApiDisabledException();
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(file.getBytes()) {
                        @Override
                        public String getFilename() {
                            return file.getOriginalFilename();
                        }
                    })
                    .header("Content-Type", file.getContentType() != null ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE);
            builder.part("preprocess", "doc");
            builder.part("use_llm_correction", "false");

            String raw = webClient.post()
                    .uri("/upload")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(180))
                    .block();

            return objectMapper.readTree(raw);
        } catch (WebClientResponseException e) {
            throw new RuntimeException("FastAPI(/upload) 호출 실패 - status=" + e.getStatusCode() + ", body=" + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("FastAPI(/upload) 호출 중 예외", e);
        }
    }

    public JsonNode riskAnalysis(long documentId) {
        if (!enabled) throw new FastApiDisabledException();
        try {
            String raw = webClient.post()
                    .uri("/documents/{id}/risk-analysis", documentId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue("{}")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(120))
                    .block();

            return objectMapper.readTree(raw);
        } catch (WebClientResponseException e) {
            throw new RuntimeException("FastAPI(/documents/{id}/risk-analysis) 호출 실패 - status=" + e.getStatusCode() + ", body=" + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            throw new RuntimeException("FastAPI risk-analysis 호출 중 예외", e);
        }
    }
}

