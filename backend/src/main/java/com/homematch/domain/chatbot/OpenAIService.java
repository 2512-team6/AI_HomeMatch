package com.homematch.domain.chatbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAIService {

    private final WebClient webClient;
    private final String apiKey;
    private final String fineTunedModelId;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public OpenAIService() {
        Dotenv dotenv = Dotenv.load();
        this.apiKey = dotenv.get("OPENAI_API_KEY", "");
        this.fineTunedModelId = dotenv.get("OPENAI_FINETUNED_MODEL_ID", "");
        
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    /**
     * OpenAI API를 호출하여 LLM 응답 생성
     * 
     * @param userMessage 사용자 메시지
     * @param guideContext JSON 가이드 데이터 (문자열)
     * @param conversationHistory 대화 히스토리 (최근 N개)
     * @return LLM 응답 텍스트
     */
    public String generateResponse(String userMessage, String guideContext, List<Map<String, String>> conversationHistory) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요.";
        }

        try {
            // 시스템 프롬프트 구성
            String systemPrompt = buildSystemPrompt(guideContext);

            // 메시지 리스트 구성
            List<Map<String, String>> messages = new ArrayList<>();
            
            // 시스템 메시지 추가
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);
            messages.add(systemMsg);

            // 대화 히스토리 추가 (최근 10개만)
            if (conversationHistory != null && !conversationHistory.isEmpty()) {
                int startIndex = Math.max(0, conversationHistory.size() - 10);
                for (int i = startIndex; i < conversationHistory.size(); i++) {
                    messages.add(conversationHistory.get(i));
                }
            }

            // 현재 사용자 메시지 추가
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);
            messages.add(userMsg);

            // API 요청 본문 구성
            Map<String, Object> requestBody = new HashMap<>();
            // 파인튜닝 모델이 설정되어 있으면 우선 사용, 없으면 기본 모델 사용
            String modelToUse = (fineTunedModelId != null && !fineTunedModelId.isEmpty())
                    ? fineTunedModelId
                    : "gpt-4o-mini";
            requestBody.put("model", modelToUse);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 1000);

            // API 호출
            String responseJson = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // 응답 파싱 및 마크다운 제거 (### ** * 등 GPT스러운 형식 제거)
            JsonNode responseNode = objectMapper.readTree(responseJson);
            JsonNode choices = responseNode.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                JsonNode message = choices.get(0).get("message");
                if (message != null && message.has("content")) {
                    String raw = message.get("content").asText();
                    return sanitizeMarkdown(raw);
                }
            }

            return "응답을 생성하는 중 오류가 발생했습니다.";

        } catch (Exception e) {
            e.printStackTrace();
            return "OpenAI API 호출 중 오류가 발생했습니다: " + e.getMessage();
        }
    }

    /** GPT 스타일 마크다운(### ** * 등) 제거 후 일반 문장만 반환 */
    private String sanitizeMarkdown(String text) {
        if (text == null || text.isBlank()) return text;
        String s = text;
        // ### ## # 제거 (줄 앞의 # 과 뒤 공백)
        s = s.replaceAll("(?m)^#{1,6}\\s*", "");
        // **텍스트** → 텍스트
        s = s.replaceAll("\\*\\*([^*]+)\\*\\*", "$1");
        // *텍스트* (단어 단위, ** 와 구분 위해 짝수개 *만) → 텍스트. * 한 개짜리 강조도 제거
        s = s.replaceAll("\\*([^*]+)\\*", "$1");
        // 남은 불필요 줄바꿈·공백 정리 (연속 빈 줄은 하나로)
        s = s.replaceAll("(\n\\s*){3,}", "\n\n").trim();
        return s;
    }

    /**
     * 시스템 프롬프트 구성
     * - 가이드(JSON)만 근거로, 사람 상담사처럼 간단 명료·참고 안내 톤. 마크다운(### ** *) 사용 금지.
     */
    private String buildSystemPrompt(String guideContext) {
        return "당신은 Home'Scan 앱 이용자를 돕는 상담사입니다. 아래 [가이드 정보]만을 참고해서 답하세요.\n\n" +
               "말투·형식:\n" +
               "- 진짜 사람 상담사처럼 짧고 명확하게 말하세요. GPT/AI스러운 말투(예: \"~해 드릴게요\", \"궁금하신 점\" 반복, 과한 존댓말)는 쓰지 마세요.\n" +
               "- 절대 정답을 주는 게 아니라 '참고하면 좋다'는 식으로만 안내하세요. 예: \"가이드에는 ○○라고 돼 있어요. 그걸 참고해 보시고, 더 자세한 건 퇴실관리 페이지에서 확인해 보시면 돼요.\"\n" +
               "- 답변에 ###, **, *, #, 불릿 리스트용 마크다운을 사용하지 마세요. 일반 문장만으로 써 주세요.\n\n" +
               "내용 규칙:\n" +
               "- 답변의 근거는 오직 아래 가이드 정보뿐입니다. 가이드에 없는 내용은 추측하지 말고, \"그건 가이드에 없어서 ○○ 페이지나 문의로 확인해 보시는 게 좋아요\"라고만 안내하세요.\n" +
               "- 가이드에 있는 내용만 간단히 풀어서 알려 주세요. 법·금액·기간 등은 가이드에 적힌 것만 인용하세요.\n" +
               "- 필요하면 한 줄만 \"(가이드 기준 참고용이에요, 법률 자문이 아님)\"처럼 붙여도 됩니다.\n\n" +
               "답변 예시 (톤 참고):\n" +
               "사용자: 보증금은 언제 받을 수 있나요?\n" +
               "어시스턴트: 가이드에는 퇴실 후 인도받은 뒤에 보증금 반환한다고 돼 있어요. 보통 1개월 안에 하는 걸 합리적인 기간으로 보는 경우가 많고, 관리비 정산·점검 같은 걸로 조금 늦어질 수 있다고 되어 있어요. 정확한 일정은 퇴실관리 페이지에서 확인해 보시는 게 좋아요.\n\n" +
               "가이드 정보 (이 내용만 사용할 것):\n" + guideContext + "\n\n" +
               "가이드에 없는 주제는 \"해당 내용은 가이드에 없어서 ○○ 페이지에서 확인해 주세요\" 정도로만 답하세요.";
    }
}
