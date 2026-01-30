package com.homematch.domain.chatbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.FluxSink;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class OpenAIService {

    private static final Logger log = LoggerFactory.getLogger(OpenAIService.class);

    /** API 호출 타임아웃(초) */
    private static final int TIMEOUT_SECONDS = 60;
    /** 일시 오류 시 재시도 횟수 */
    private static final int MAX_RETRIES = 3;
    /** 가이드 컨텍스트 최대 문자 수 (대략 3k 토큰) */
    private static final int MAX_GUIDE_CHARS = 12_000;
    /** 가이드 이탈 의심 시 디스클레이머 붙일 키워드 (판결·소송·법원 등) */
    private static final Pattern GUIDE_DRIFT_KEYWORDS = Pattern.compile(
            "판결|원고|피고|법원의|대법원|1심|2심|확정\\s*판결|소송\\s*절차");

    /** 사이트와 별개 내용(가이드 밖) 질문 시 사용할 고정 안내 문구. 줄바꿈·띄어쓰기 유지 */
    private static final String OFF_TOPIC_MESSAGE =
            "입력해 주신 내용은 현재 제공 중인 Home'Scan 가이드에 없는 내용이라 정확한 안내가 어려운 점 양해 부탁드립니다.\n"
            + "가이드에 있는 주제(계약서 점검, 등기부등본 분석, 거주 중 관리, 퇴실 관리)와 관련된 내용을 입력해 주시면 바로 안내해 드릴게요.";

    /** 서버/서비스에서 사용할 사이트 외 고정 문구 반환 */
    public String offTopicMessage() {
        return OFF_TOPIC_MESSAGE;
    }

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
     * OpenAI API를 호출하여 LLM 응답 생성.
     * 재시도·타임아웃·usage 로깅·가이드 길이 제한·가이드 이탈 검사 적용.
     */
    public String generateResponse(String userMessage, String guideContext, List<Map<String, String>> conversationHistory) {
        return generateResponse(userMessage, guideContext, conversationHistory, true);
    }

    public String generateResponse(String userMessage, String guideContext, List<Map<String, String>> conversationHistory, boolean inScope) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요.";
        }

        String truncatedGuide = truncateGuideContext(guideContext);

        try {
            String systemPrompt = buildSystemPrompt(truncatedGuide, inScope);
            List<Map<String, String>> messages = buildMessages(systemPrompt, userMessage, conversationHistory);
            Map<String, Object> requestBody = buildRequestBody(messages);

            Mono<String> call = webClient.post()
                    .uri("/chat/completions")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                    .retryWhen(Retry.fixedDelay(MAX_RETRIES - 1, Duration.ofSeconds(2))
                            .filter(t -> isRetryable(t)));

            String responseJson = call.block(Duration.ofSeconds(TIMEOUT_SECONDS + 10));

            JsonNode root = objectMapper.readTree(responseJson);
            logUsage(root);

            JsonNode choices = root.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                JsonNode message = choices.get(0).get("message");
                if (message != null && message.has("content")) {
                    String raw = message.get("content").asText();
                    String cleaned = sanitizeMarkdown(raw);
                    cleaned = restoreKoreanSpacing(cleaned);
                    cleaned = normalizePunctuationAndLineBreaks(cleaned);
                    cleaned = normalizeOffTopicToFixedMessage(cleaned, userMessage);
                    cleaned = applyGuideDriftDisclaimer(cleaned);

                    // 인스코프인데도 고정 문구가 나온 경우: 프롬프트를 더 강하게 해서 1회 재시도
                    if (inScope && isOffTopicMessage(cleaned)) {
                        String retryPrompt = buildSystemPrompt(truncatedGuide, true) +
                                "\n\n[추가 지시]\n- 이 질문은 Home'Scan 도메인 안 질문입니다.\n- 절대 [사이트 외 질문 고정 문구]를 출력하지 마세요.\n";
                        List<Map<String, String>> retryMessages = buildMessages(retryPrompt, userMessage, conversationHistory);
                        Map<String, Object> retryBody = buildRequestBody(retryMessages);
                        String retryJson = webClient.post()
                                .uri("/chat/completions")
                                .bodyValue(retryBody)
                                .retrieve()
                                .bodyToMono(String.class)
                                .timeout(Duration.ofSeconds(TIMEOUT_SECONDS))
                                .block(Duration.ofSeconds(TIMEOUT_SECONDS + 10));
                        if (retryJson != null && !retryJson.isBlank()) {
                            JsonNode retryRoot = objectMapper.readTree(retryJson);
                            logUsage(retryRoot);
                            JsonNode retryChoices = retryRoot.get("choices");
                            if (retryChoices != null && retryChoices.isArray() && retryChoices.size() > 0) {
                                JsonNode retryMsg = retryChoices.get(0).get("message");
                                if (retryMsg != null && retryMsg.has("content")) {
                                    String r = retryMsg.get("content").asText();
                                    String c = sanitizeMarkdown(r);
                                    c = restoreKoreanSpacing(c);
                                    c = normalizePunctuationAndLineBreaks(c);
                                    c = normalizeOffTopicToFixedMessage(c, userMessage);
                                    c = applyGuideDriftDisclaimer(c);
                                    return c;
                                }
                            }
                        }
                    }
                    return cleaned;
                }
            }
            return "응답을 생성하는 중 오류가 발생했습니다.";
        } catch (Exception e) {
            log.warn("OpenAI API 호출 실패 (재시도 소진 또는 타임아웃): {}", e.getMessage());
            return "OpenAI API 호출 중 오류가 발생했습니다: " + e.getMessage();
        }
    }

    /**
     * 스트리밍 응답 생성. chunk 단위로 Flux 반환.
     * DataBuffer 스트림을 줄 단위로 버퍼링한 뒤 "data: {...}"만 파싱.
     */
    public Flux<String> generateResponseStreaming(String userMessage, String guideContext,
                                                   List<Map<String, String>> conversationHistory) {
        return generateResponseStreaming(userMessage, guideContext, conversationHistory, true);
    }

    public Flux<String> generateResponseStreaming(String userMessage, String guideContext,
                                                   List<Map<String, String>> conversationHistory, boolean inScope) {
        if (apiKey == null || apiKey.isEmpty()) {
            return Flux.just("OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요.");
        }

        String truncatedGuide = truncateGuideContext(guideContext);
        String systemPrompt = buildSystemPrompt(truncatedGuide, inScope);
        List<Map<String, String>> messages = buildMessages(systemPrompt, userMessage, conversationHistory);
        Map<String, Object> requestBody = buildRequestBody(messages);
        requestBody.put("stream", true);

        Flux<DataBuffer> bodyFlux = webClient.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .exchangeToFlux(res -> res.bodyToFlux(DataBuffer.class))
                .timeout(Duration.ofSeconds(TIMEOUT_SECONDS));

        return Flux.<String>create(sink -> {
            StringBuilder buf = new StringBuilder();
            bodyFlux.subscribe(
                    db -> {
                        String s = dataBufferToString(db);
                        DataBufferUtils.release(db);
                        buf.append(s);
                        flushStreamLines(buf, sink);
                    },
                    sink::error,
                    () -> {
                        flushStreamLines(buf, sink);
                        sink.complete();
                    }
            );
        }).onErrorResume(t -> {
            log.warn("스트리밍 중 오류: {}", t.getMessage());
            return Flux.just("(응답 생성 중 일시 오류가 있었습니다.)");
        });
    }

    private boolean isOffTopicMessage(String text) {
        if (text == null) return false;
        String a = text.replaceAll("\\s+", "");
        String b = OFF_TOPIC_MESSAGE.replaceAll("\\s+", "");
        return !a.isBlank() && a.contains(b);
    }

    private String dataBufferToString(DataBuffer db) {
        int n = db.readableByteCount();
        if (n <= 0) return "";
        byte[] bytes = new byte[n];
        db.read(bytes);
        return new String(bytes, StandardCharsets.UTF_8);
    }

    /** buf에서 줄 단위로 잘라 "data: {...}"만 파싱해 sink로 delta 전달 */
    private void flushStreamLines(StringBuilder buf, FluxSink<String> sink) {
        int idx;
        while ((idx = buf.indexOf("\n")) >= 0) {
            String line = buf.substring(0, idx).trim();
            buf.delete(0, idx + 1);
            if (line.startsWith("data: ")) {
                String rest = line.substring(6).trim();
                if ("[DONE]".equals(rest) || rest.isEmpty()) continue;
                String delta = parseStreamDelta(rest);
                if (delta != null) sink.next(delta);
            }
        }
    }

    private String parseStreamDelta(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                JsonNode delta = choices.get(0).path("delta");
                if (delta.has("content")) {
                    return delta.get("content").asText();
                }
            }
        } catch (Exception ignored) { }
        return null;
    }

    private boolean isRetryable(Throwable t) {
        String msg = t.getMessage();
        if (msg == null) return false;
        return msg.contains("timeout") || msg.contains("Timeout")
                || msg.contains("503") || msg.contains("502") || msg.contains("429")
                || msg.contains("Connection") || msg.contains("connection");
    }

    private List<Map<String, String>> buildMessages(String systemPrompt, String userMessage,
                                                     List<Map<String, String>> conversationHistory) {
        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", systemPrompt);
        messages.add(systemMsg);

        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            int start = Math.max(0, conversationHistory.size() - 10);
            for (int i = start; i < conversationHistory.size(); i++) {
                messages.add(conversationHistory.get(i));
            }
        }

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);
        return messages;
    }

    private Map<String, Object> buildRequestBody(List<Map<String, String>> messages) {
        Map<String, Object> body = new HashMap<>();
        String model = (fineTunedModelId != null && !fineTunedModelId.isEmpty())
                ? fineTunedModelId : "gpt-4o-mini";
        body.put("model", model);
        body.put("messages", messages);
        body.put("temperature", 0.3);
        body.put("max_tokens", 1000);
        return body;
    }

    private String truncateGuideContext(String guideContext) {
        if (guideContext == null) return "";
        if (guideContext.length() <= MAX_GUIDE_CHARS) return guideContext;
        return guideContext.substring(0, MAX_GUIDE_CHARS) + "\n\n(가이드 내용이 많아 일부만 사용했습니다.)";
    }

    private void logUsage(JsonNode responseNode) {
        try {
            JsonNode usage = responseNode.get("usage");
            if (usage != null) {
                int prompt = usage.path("prompt_tokens").asInt(0);
                int completion = usage.path("completion_tokens").asInt(0);
                int total = usage.path("total_tokens").asInt(0);
                log.info("OpenAI usage: prompt_tokens={}, completion_tokens={}, total_tokens={}", prompt, completion, total);
            }
        } catch (Exception e) {
            log.debug("usage 파싱 생략: {}", e.getMessage());
        }
    }

    /** 사이트 외 질문에 대한 답이면 고정 문구(줄바꿈·띄어쓰기 유지)로 통일. (LLM 출력 변형/띄어쓰기 차이 흡수용) */
    private String normalizeOffTopicToFixedMessage(String text, String userMessage) {
        if (text == null || text.isBlank()) return text;
        String t = text.trim();

        // LLM이 "범위 밖" 거절 문구를 만들었거나, 고정 문구를 변형했을 때만 통일한다.
        // (인스코프 질문에 대해서는 가이드에 없는 내용도 일반적인 참고 안내를 할 수 있으므로,
        //  "가이드에 없" 같은 표현만으로는 강제 치환하지 않는다.)
        if (t.contains("범위") && (t.contains("밖") || t.contains("외"))) {
            return OFF_TOPIC_MESSAGE;
        }
        if (t.contains("관련이 없어") && (t.contains("안내가 어려운") || t.contains("양해 부탁"))) {
            return OFF_TOPIC_MESSAGE;
        }

        // 띄어쓰기 없이 나온 경우(입력해주신내용은현재제공중인... 등) → 고정 문구로 치환
        String noSpace = t.replaceAll("\\s+", "");
        String fixedNoSpace = OFF_TOPIC_MESSAGE.replaceAll("\\s+", "");
        if (!fixedNoSpace.isBlank() && noSpace.contains(fixedNoSpace)) return OFF_TOPIC_MESSAGE;
        if (noSpace.contains("계약서점검서비스와는관련이없어") || noSpace.contains("양해부탁드립니다")
                || noSpace.contains("계약서점검과관련된") || noSpace.contains("입력해주신내용은현재제공중인")) {
            return OFF_TOPIC_MESSAGE;
        }
        return text;
    }

    /** 가이드 이탈 의심 시 디스클레이머 추가 (사이트 외 법률 확정 조언 방지) */
    private String applyGuideDriftDisclaimer(String text) {
        if (text == null || text.isBlank()) return text;
        if (GUIDE_DRIFT_KEYWORDS.matcher(text).find()) {
            String disclaimer = " (가이드 기준 참고용이에요, 법률 자문이 아님)";
            if (!text.trim().endsWith(disclaimer.trim())) {
                return text.trim() + disclaimer;
            }
        }
        return text;
    }

    private String sanitizeMarkdown(String text) {
        if (text == null || text.isBlank()) return text;
        String s = text;
        s = s.replaceAll("(?m)^#{1,6}\\s*", "");
        s = s.replaceAll("\\*\\*([^*]+)\\*\\*", "$1");
        s = s.replaceAll("\\*([^*]+)\\*", "$1");
        s = s.replaceAll("`[^`]*`", ""); // 인라인 코드 제거
        s = s.replaceAll("(\n\\s*){3,}", "\n\n").trim();
        return s;
    }

    /** LLM 원문에 마크다운 제거 + 한글 띄어쓰기 복원 + 문장 끝/줄바꿈 정리. 스트리밍 누적본 등에 사용 */
    public String normalizeResponseText(String raw) {
        if (raw == null || raw.isBlank()) return raw;
        String s = sanitizeMarkdown(raw);
        s = restoreKoreanSpacing(s);
        s = normalizePunctuationAndLineBreaks(s);
        // 사용자 메시지 정보가 없으므로 관련 주제 체크 없이 처리 (스트리밍 완료 후 호출)
        s = normalizeOffTopicToFixedMessage(s, null);
        return s;
    }

    /** 가이드·상담 관련 표현이 띄어쓰기 없이 나왔을 때 복원 (흔한 구절만) */
    private String restoreKoreanSpacing(String text) {
        if (text == null || text.isBlank()) return text;
        String s = text;
        // 퇴실 가이드 관련 (긴 것부터 치환)
        s = s.replace("가이드에는퇴실체크리스트,원상복구체크리스트,보증금관리,퇴실준비일정가이드등의정보가포함되어있어요", "가이드에는 퇴실 체크리스트, 원상 복구 체크리스트, 보증금 관리, 퇴실 준비 일정 가이드 등의 정보가 포함되어 있어요.");
        s = s.replace("퇴실체크리스트에는전기·가스·수도해지,열쇠반납,우편물주소변경등의항목이있어요", "퇴실 체크리스트에는 전기·가스·수도 해지, 열쇠 반납, 우편물 주소 변경 등의 항목이 있어요.");
        s = s.replace("원상복구체크리스트는바닥재,가구,창문,벽지,조명상태등을확인하는데도움이됩니다", "원상 복구 체크리스트는 바닥재, 가구, 창문, 벽지, 조명 상태 등을 확인하는 데 도움이 됩니다.");
        s = s.replace("보증금관리는퇴실후보증금반환에대한의무와절차를안내하고있어요", "보증금 관리는 퇴실 후 보증금 반환에 대한 의무와 절차를 안내하고 있어요.");
        s = s.replace("퇴실준비일정가이드는퇴실1주일전부터퇴실당일까지의준비사항을정리해줍니다", "퇴실 준비 일정 가이드는 퇴실 1주일 전부터 퇴실 당일까지의 준비사항을 정리해 줍니다.");
        s = s.replace("더자세한내용은각항목의페이지에서확인해보시면돼요", "더 자세한 내용은 각 항목의 페이지에서 확인해 보시면 돼요.");
        s = s.replace("등의정보가포함되어있어요", " 등의 정보가 포함되어 있어요");
        s = s.replace("등의항목이있어요", " 등의 항목이 있어요");
        s = s.replace("확인하는데도움이됩니다", "확인하는 데 도움이 됩니다");
        s = s.replace("퇴실체크리스트에는", "퇴실 체크리스트에는");
        s = s.replace("원상복구체크리스트는", "원상 복구 체크리스트는");
        s = s.replace("보증금관리는", "보증금 관리는");
        s = s.replace("퇴실준비일정가이드는", "퇴실 준비 일정 가이드는");
        s = s.replace("퇴실후보증금반환에대한의무와절차를안내하고있어요", "퇴실 후 보증금 반환에 대한 의무와 절차를 안내하고 있어요.");
        s = s.replace("퇴실1주일전부터퇴실당일까지의준비사항을정리해줍니다", "퇴실 1주일 전부터 퇴실 당일까지의 준비사항을 정리해 줍니다.");
        s = s.replace("퇴실체크리스트", "퇴실 체크리스트");
        s = s.replace("원상복구체크리스트", "원상 복구 체크리스트");
        s = s.replace("퇴실준비일정가이드", "퇴실 준비 일정 가이드");
        s = s.replace("보증금관리", "보증금 관리");
        s = s.replace("열쇠반납", "열쇠 반납");
        s = s.replace("우편물주소변경", "우편물 주소 변경");
        // 가이드/거주 관련 (긴 것부터 치환해 부분 겹침 방지)
        s = s.replace("거주중이슈기록은발생한하자나문제를기록하고처리과정을관리할수있도록해줍니다", "거주 중 이슈 기록은 발생한 하자나 문제를 기록하고 처리 과정을 관리할 수 있도록 해 줍니다.");
        s = s.replace("거주중이슈기록", "거주 중 이슈 기록");
        s = s.replace("입주상태기록", "입주 상태 기록");
        s = s.replace("거주계약기간관리는", "거주 계약 기간 관리는");
        s = s.replace("거주계약기간관리", "거주 계약 기간 관리");
        s = s.replace("주거비관리는", "주거비 관리는");
        s = s.replace("주거비관리", "주거비 관리");
        s = s.replace("등의기능이포함되어있어요", " 등의 기능이 포함되어 있어요");
        s = s.replace("입주일과거주종료일을", "입주일과 거주 종료일을");
        s = s.replace("계약기간을관리할수있고", "계약 기간을 관리할 수 있고");
        s = s.replace("월세와공과금을한눈에관리할수있도록도와줍니다", "월세와 공과금을 한눈에 관리할 수 있도록 도와 줍니다.");
        s = s.replace("월세와공과금을한눈에관리할수있도록", "월세와 공과금을 한눈에 관리할 수 있도록");
        s = s.replace("입주당시의상태를사진으로남길수있게해주고", "입주 당시의 상태를 사진으로 남길 수 있게 해 주고,");
        s = s.replace("입주당시의상태를사진으로", "입주 당시의 상태를 사진으로");
        s = s.replace("남길수있게해주고", "남길 수 있게 해 주고,");
        s = s.replace("발생한하자나문제를기록하고처리과정을관리할수있도록해줍니다", "발생한 하자나 문제를 기록하고 처리 과정을 관리할 수 있도록 해 줍니다.");
        s = s.replace("더자세한내용은각관리기능의페이지에서확인해보시면돼요", "더 자세한 내용은 각 관리 기능의 페이지에서 확인해 보시면 돼요.");
        s = s.replace("관리할수있도록", "관리할 수 있도록");
        s = s.replace("할수있고", "할 수 있고");
        s = s.replace("할수있게", "할 수 있게");
        s = s.replace("할수있어요", "할 수 있어요");
        s = s.replace("할수있습니다", "할 수 있습니다");
        s = s.replace("해보시면돼요", "해 보시면 돼요");
        s = s.replaceAll("가이드에는(\\S)", "가이드에는 $1");
        return s;
    }

    /** 문장 끝 마침표, 띄어쓰기, 줄바꿈 정리 (가이드 밖 질문 답변 가독용) */
    private String normalizePunctuationAndLineBreaks(String text) {
        if (text == null || text.isBlank()) return text;
        String s = text.trim();
        // 끝의 ... / .... 제거 후 마침표 하나로 (어색한 말줄임 방지)
        s = s.replaceAll("[.]{2,}\\s*$", ".");
        // 연속 공백을 하나로
        s = s.replaceAll(" +", " ");
        // 문장 끝(. ? !) 뒤 공백·줄바꿈을 줄바꿈 하나로 → 문장마다 한 줄
        s = s.replaceAll("\\.\\s+", ".\n");
        s = s.replaceAll("\\?\\s+", "?\n");
        s = s.replaceAll("!\\s+", "!\n");
        // 연속 줄바꿈은 최대 2개로
        s = s.replaceAll("(\n\\s*){3,}", "\n\n");
        s = s.trim();
        // 전체 끝이 . ? ! 가 아니면 마침표
        if (s.length() > 0 && !s.matches(".*[.?!]$")) {
            s = s + ".";
        }
        // 끝에 마침표가 2개 이상(.. / ...)이면 하나로 (항상 점 하나만)
        s = s.replaceAll("\\.{2,}\\s*$", ".");
        return s.trim();
    }

    private String buildSystemPrompt(String guideContext) {
        return buildSystemPrompt(guideContext, true);
    }

    private String buildSystemPrompt(String guideContext, boolean inScope) {
        if (!inScope) {
            return "당신은 Home'Scan 앱 이용자를 돕는 상담사입니다.\n\n" +
                    "[규칙]\n" +
                    "- 이 질문은 Home'Scan 도메인 밖 질문입니다.\n" +
                    "- 아래 [사이트 외 질문 고정 문구]만 그대로 출력하세요.\n\n" +
                    "[사이트 외 질문 고정 문구]:\n" + OFF_TOPIC_MESSAGE;
        }

        return "당신은 Home'Scan 앱 이용자를 돕는 상담사입니다.\n\n" +
                "[서버 판정]\n" +
                "- 이 질문은 Home'Scan 도메인 안 질문입니다.\n" +
                "- 따라서 [사이트 외 질문 고정 문구]는 절대 출력하지 마세요.\n\n" +
                "[핵심 정책]\n" +
                "- 사용자의 질문이 Home'Scan 도메인(주거/임대차/매물/계약/등기/거주 중 하자/퇴실/보증금/분쟁, 그리고 앱 사용법)에 해당하면 도움 되는 답을 하세요.\n" +
                "- 이때 아래 [가이드 정보]에 관련 내용이 있으면 그것을 우선 활용하고, 부족한 부분은 일반적인 참고 수준에서 보완해도 됩니다.\n" +
                "  단, 가이드에 없는 '특정 법 조항/판례/정확한 기간/금액'을 단정해서 말하지 마세요.\n" +
                "- 답변에서 \"가이드에 없어서\" 같은 표현으로 책임 회피하지 말고, 가능한 범위에서 바로 도움이 되게 안내하세요.\n\n" +
                "[필수] 띄어쓰기:\n" +
                "- 한국어로 답할 때 반드시 띄어쓰기를 해 주세요. 단어와 조사(은,는,이,가,을,를,와,과,의,에,에서) 사이, 단어와 단어 사이에 공백을 넣어 주세요.\n" +
                "- 잘못된 예(사용 금지): 가이드에는거주계약기간관리, 주거비관리, 입주상태기록\n" +
                "- 올바른 예: 가이드에는 거주 계약 기간 관리, 주거비 관리, 입주 상태 기록, 거주 중 이슈 기록 등의 기능이 포함되어 있어요.\n\n" +
                "말투·형식:\n" +
                "- 진짜 사람 상담사처럼 짧고 명확하게 말하세요. GPT/AI스러운 말투(예: \"~해 드릴게요\", \"궁금하신 점\" 반복, 과한 존댓말)는 쓰지 마세요.\n" +
                "- 절대 정답을 주는 게 아니라 '참고하면 좋다'는 식으로만 안내하세요. 예: \"가이드에는 ○○라고 돼 있어요. 그걸 참고해 보시고, 더 자세한 건 퇴실관리 페이지에서 확인해 보시면 돼요.\"\n" +
                "- 답변에 ###, **, *, #, 불릿 리스트용 마크다운을 사용하지 마세요. 일반 문장만으로 써 주세요.\n" +
                "- 문장 끝에는 반드시 마침표(.)를 붙이고, 문장이 바뀔 때마다 줄바꿈을 넣어 주세요.\n" +
                "- 필요하면 한 줄만 \"(가이드 기준 참고용이에요, 법률 자문이 아님)\"처럼 붙여도 됩니다.\n\n" +
                "답변 예시 (톤 참고):\n" +
                "사용자: 보증금은 언제 받을 수 있나요?\n" +
                "어시스턴트: 가이드에는 퇴실 후 인도받은 뒤에 보증금 반환한다고 돼 있어요. 보통 1개월 안에 하는 걸 합리적인 기간으로 보는 경우가 많고, 관리비 정산·점검 같은 걸로 조금 늦어질 수 있다고 되어 있어요. 정확한 일정은 퇴실관리 페이지에서 확인해 보시는 게 좋아요.\n\n" +
                "사용자: 벽이 오염됐는데 어떻게 해야 하나요?\n" +
                "어시스턴트: 우선 사진이나 영상으로 상태와 위치를 남겨 두는 게 좋아요.\n" +
                "거주 중 이슈 기록에 발생 시각, 위치, 상태를 같이 기록해 두면 이후 정리할 때 도움이 돼요.\n" +
                "임대인과 소통한 내용도 함께 기록해 두세요.\n\n" +
                "가이드 정보 (참고용):\n" + guideContext;
    }
}
