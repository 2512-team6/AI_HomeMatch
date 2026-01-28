package com.homematch.domain.chatbot;

import com.homematch.domain.chatbot.dto.ChatbotMessageRequest;
import com.homematch.domain.chatbot.dto.ChatbotMessageResponse;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import com.homematch.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;

import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

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

    // 추천 질문 목록 (topic: residency, moveout, contract_review, deed_analysis) — 인증 없이 조회 가능
    @GetMapping("/suggested-questions")
    public ResponseEntity<?> getSuggestedQuestions(@RequestParam(required = false) String topic) {
        try {
            List<Map<String, String>> list = chatbotService.getSuggestedQuestions(topic);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // 메시지 전송
    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChatbotMessageRequest request) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"Authorization 헤더가 올바르지 않습니다.\"}");
            }
            
            String token = authHeader.replace("Bearer ", "").trim();
            
            if (token.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"토큰이 제공되지 않았습니다.\"}");
            }
            
            if (request.getText() == null || request.getText().trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("{\"error\": \"메시지 내용이 비어있습니다.\"}");
            }
            
            Integer userNo = getUserIdFromToken(token);
            ChatbotMessageResponse response = chatbotService.sendMessage(userNo, request);
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

    /** 스트리밍 메시지 전송: SSE로 청크 단위 응답. 완료 시 봇 메시지 DB 저장. */
    @PostMapping(value = "/messages/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<ServerSentEvent<String>>> sendMessageStream(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChatbotMessageRequest request) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        String token = authHeader.replace("Bearer ", "").trim();
        if (token.isEmpty() || (request.getText() == null || request.getText().trim().isEmpty())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        Integer userNo;
        try {
            userNo = getUserIdFromToken(token);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        Flux<String> flux = chatbotService.streamResponse(userNo, request);
        StringBuilder acc = new StringBuilder();
        Flux<String> withFinal = flux
                .doOnNext(acc::append)
                .concatWith(Flux.defer(() -> {
                    String normalized = chatbotService.normalizeResponseTextForDisplay(acc.toString());
                    chatbotService.appendBotMessage(userNo, normalized);
                    return Flux.just("[FINAL]\n" + normalized);
                }));
        Flux<ServerSentEvent<String>> sseFlux = withFinal.map(chunk -> ServerSentEvent.builder(chunk).build());

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .body(sseFlux);
    }

    // 메시지 히스토리 조회
    @GetMapping("/messages")
    public ResponseEntity<?> getMessageHistory(
            @RequestHeader("Authorization") String authHeader) {
        try {
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
            List<ChatbotMessageResponse> messages = chatbotService.getMessageHistory(userNo);
            return ResponseEntity.ok(messages);
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

    // 메시지 히스토리 삭제
    @DeleteMapping("/messages")
    public ResponseEntity<?> clearMessageHistory(
            @RequestHeader("Authorization") String authHeader) {
        try {
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
            chatbotService.clearMessageHistory(userNo);
            return ResponseEntity.noContent().build();
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
