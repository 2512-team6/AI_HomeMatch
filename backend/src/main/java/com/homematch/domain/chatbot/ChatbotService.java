package com.homematch.domain.chatbot;

import com.homematch.domain.chatbot.dto.ChatbotMessageRequest;
import com.homematch.domain.chatbot.dto.ChatbotMessageResponse;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import reactor.core.publisher.Flux;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatbotService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final OpenAIService openAIService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private JsonNode guideData = null;

    // 가이드 데이터 로드 (최초 1회)
    private JsonNode loadGuideData() {
        if (guideData != null) {
            return guideData;
        }
        try {
            ClassPathResource resource = new ClassPathResource("chatbot-guides.json");
            InputStream inputStream = resource.getInputStream();
            guideData = objectMapper.readTree(inputStream);
            return guideData;
        } catch (Exception e) {
            System.err.println("가이드 데이터 로드 실패: " + e.getMessage());
            return null;
        }
    }

    /** 가이드 컨텍스트 최대 문자 수 (토큰·비용 관리) */
    private static final int DEFAULT_MAX_GUIDE_CHARS = 12_000;

    /**
     * 가이드 데이터를 문자열로 변환 (LLM 컨텍스트용).
     * topic 있으면 해당 섹션만, userMessage 있으면 관련 구간 우선 포함, maxChars > 0 이면 잘라냄.
     */
    private String getGuideContextAsString(String topic, String userMessage, int maxChars) {
        JsonNode guides = loadGuideData();
        if (guides == null) {
            return "가이드 데이터를 불러올 수 없습니다.";
        }
        JsonNode target = guides;
        if (topic != null && !topic.isBlank()) {
            switch (topic.trim().toLowerCase()) {
                case "contract_review" -> target = guides.has("contract_guide") ? guides.get("contract_guide") : guides;
                case "deed_analysis" -> target = guides.has("contract_guide") ? guides.get("contract_guide") : guides;
                case "residency" -> target = guides.has("residency_management") ? guides.get("residency_management") : guides;
                case "moveout" -> target = guides.has("moveout_management") ? guides.get("moveout_management") : guides;
                default -> { }
            }
        }
        if (userMessage != null && !userMessage.isBlank() && target.isObject()) {
            Set<String> tokens = Stream.of(userMessage.replaceAll("\\s+", " ").trim().split(" "))
                    .map(String::trim)
                    .filter(s -> s.length() >= 2)
                    .collect(Collectors.toSet());
            if (!tokens.isEmpty()) {
                JsonNode reduced = reduceGuideByRelevance(target, tokens);
                if (reduced != null) {
                    target = reduced;
                }
            }
        }
        String out;
        try {
            out = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(target);
        } catch (Exception e) {
            out = target.toString();
        }
        if (maxChars > 0 && out.length() > maxChars) {
            out = out.substring(0, maxChars) + "\n\n(가이드 내용이 많아 일부만 사용했습니다.)";
        }
        return out;
    }

    /** userMessage 토큰과 겹치는 필드만 남긴 서브트리. 없으면 null(전체 유지) */
    private JsonNode reduceGuideByRelevance(JsonNode node, Set<String> tokens) {
        if (!node.isObject()) return null;
        List<String> keep = new ArrayList<>();
        for (var it = node.fields(); it.hasNext(); ) {
            var e = it.next();
            String valueStr = e.getValue().toString();
            boolean match = tokens.stream().anyMatch(t -> valueStr.contains(t));
            if (match) {
                keep.add(e.getKey());
            }
        }
        if (keep.isEmpty()) return null;
        if (keep.size() == node.size()) return node;
        try {
            var out = objectMapper.createObjectNode();
            for (String k : keep) {
                out.set(k, node.get(k));
            }
            return out;
        } catch (Exception ex) {
            return null;
        }
    }

    /** 추천 질문 목록 반환 (topic: residency, moveout, contract_review, deed_analysis) */
    @Transactional(readOnly = true)
    public List<Map<String, String>> getSuggestedQuestions(String topic) {
        JsonNode guides = loadGuideData();
        if (guides == null || !guides.has("suggested_questions")) {
            return Collections.emptyList();
        }
        JsonNode sq = guides.get("suggested_questions");
        String key = topic == null || topic.isBlank() ? null : topic.trim().toLowerCase();
        if (key == null || !sq.has(key) || !sq.get(key).isArray()) {
            return Collections.emptyList();
        }
        List<Map<String, String>> result = new ArrayList<>();
        for (JsonNode item : sq.get(key)) {
            if (!item.has("label")) continue;
            Map<String, String> m = new HashMap<>();
            m.put("label", item.get("label").asText());
            if (item.has("section")) m.put("section", item.get("section").asText());
            result.add(m);
        }
        return result;
    }

    /** 추천 질문·섹션 매칭 시 가이드 JSON 해당 블록을 읽기 쉬운 문장으로 포맷해 즉답. 매칭 실패 시 null */
    private String resolveDirectGuideAnswer(String topic, String userText) {
        if (userText == null || userText.isBlank()) return null;
        JsonNode guides = loadGuideData();
        if (guides == null || !guides.has("suggested_questions")) return null;
        JsonNode sq = guides.get("suggested_questions");
        String key = topic == null || topic.isBlank() ? null : topic.trim().toLowerCase();
        if (key == null || !sq.has(key) || !sq.get(key).isArray()) return null;
        String trim = userText.trim();
        String sectionPath = null;
        for (JsonNode item : sq.get(key)) {
            if (item.has("label") && item.get("label").asText().trim().equals(trim) && item.has("section")) {
                sectionPath = item.get("section").asText();
                break;
            }
        }
        if (sectionPath == null || sectionPath.isBlank()) return null;
        String[] parts = sectionPath.split("\\.");
        JsonNode cur = guides;
        for (String p : parts) {
            if (cur == null || !cur.has(p)) return null;
            cur = cur.get(p);
        }
        return formatGuideSectionToText(cur);
    }

    /** 가이드 JSON 한 블록을 ###/** 없이 읽기 쉬운 문장으로 변환 */
    private String formatGuideSectionToText(JsonNode node) {
        if (node == null) return "";
        if (node.isTextual()) return node.asText();
        StringBuilder sb = new StringBuilder();
        if (node.isObject()) {
            if (node.has("title")) sb.append(node.get("title").asText()).append("\n\n");
            if (node.has("description")) sb.append(node.get("description").asText()).append("\n\n");
            if (node.has("features") && node.get("features").isArray()) {
                for (JsonNode f : node.get("features")) sb.append("· ").append(f.asText()).append("\n");
                sb.append("\n");
            }
            if (node.has("tips") && node.get("tips").isArray()) {
                sb.append("참고: ");
                for (int i = 0; i < node.get("tips").size(); i++) {
                    if (i > 0) sb.append(" ");
                    sb.append(node.get("tips").get(i).asText());
                }
                sb.append("\n\n");
            }
            if (node.has("items") && node.get("items").isArray()) {
                for (JsonNode it : node.get("items")) {
                    if (it.isTextual()) sb.append("· ").append(it.asText()).append("\n");
                    else if (it.isObject()) {
                        if (it.has("name")) sb.append("· ").append(it.get("name").asText());
                        if (it.has("description")) sb.append(": ").append(it.get("description").asText());
                        if (it.has("timing")) sb.append(" (").append(it.get("timing").asText()).append(")");
                        sb.append("\n");
                    }
                }
                sb.append("\n");
            }
            if (node.has("tip") && !node.get("tip").asText().isBlank()) {
                sb.append("참고: ").append(node.get("tip").asText()).append("\n\n");
            }
            if (node.has("return_obligation")) {
                JsonNode ro = node.get("return_obligation");
                if (ro.has("description")) sb.append(ro.get("description").asText()).append("\n\n");
                if (ro.has("reasonable_period")) sb.append("합리적인 반환 기간: ").append(ro.get("reasonable_period").asText()).append("\n\n");
                if (ro.has("note")) sb.append("참고: ").append(ro.get("note").asText()).append("\n\n");
            }
            if (node.has("guide")) {
                JsonNode g = node.get("guide");
                if (g.has("steps") && g.get("steps").isArray()) {
                    for (JsonNode s : g.get("steps")) sb.append("· ").append(s.asText()).append("\n");
                    sb.append("\n");
                }
                if (g.has("importance")) sb.append("중요: ").append(g.get("importance").asText()).append("\n\n");
            }
            if (node.has("usage")) sb.append(node.get("usage").asText()).append("\n\n");
            if (node.has("frequent_disputes") && node.get("frequent_disputes").isArray()) {
                for (JsonNode fd : node.get("frequent_disputes")) {
                    if (fd.has("item")) sb.append("· ").append(fd.get("item").asText()).append("\n");
                    if (fd.has("description")) sb.append("  ").append(fd.get("description").asText()).append("\n");
                    if (fd.has("prevention_tip")) sb.append("  참고: ").append(fd.get("prevention_tip").asText()).append("\n");
                    sb.append("\n");
                }
            }
            if (node.has("d_minus_7") || node.has("d_day") || node.has("d_plus_14")) {
                for (String dkey : new String[]{"d_minus_7", "d_minus_3", "d_day", "d_plus_14"}) {
                    if (!node.has(dkey)) continue;
                    JsonNode d = node.get(dkey);
                    if (d.has("period")) sb.append(d.get("period").asText()).append("\n");
                    if (d.has("tasks") && d.get("tasks").isArray()) {
                        for (JsonNode t : d.get("tasks")) sb.append("  · ").append(t.asText()).append("\n");
                    }
                    sb.append("\n");
                }
            }
            if (node.has("check_items") && node.get("check_items").isArray()) {
                for (JsonNode ci : node.get("check_items")) {
                    if (ci.has("item")) sb.append("· ").append(ci.get("item").asText());
                    if (ci.has("note")) sb.append(" ").append(ci.get("note").asText());
                    sb.append("\n");
                }
                sb.append("\n");
            }
            if (node.has("notice_procedure")) {
                JsonNode np = node.get("notice_procedure");
                if (np.has("title")) sb.append(np.get("title").asText()).append("\n");
                if (np.has("description")) sb.append(np.get("description").asText()).append("\n");
                if (np.has("tip")) sb.append("참고: ").append(np.get("tip").asText()).append("\n");
                sb.append("\n");
            }
            if (node.has("legal_action")) {
                JsonNode la = node.get("legal_action");
                if (la.has("title")) sb.append(la.get("title").asText()).append("\n");
                if (la.has("description")) sb.append(la.get("description").asText()).append("\n");
                if (la.has("tip")) sb.append("참고: ").append(la.get("tip").asText()).append("\n");
                sb.append("\n");
            }
            if (node.has("spaces") && node.get("spaces").isArray()) {
                sb.append("공간: ");
                for (int i = 0; i < node.get("spaces").size(); i++) {
                    if (i > 0) sb.append(", ");
                    sb.append(node.get("spaces").get(i).asText());
                }
                sb.append("\n\n");
            }
            if (node.has("statuses") && node.get("statuses").isArray()) {
                sb.append("상태: ");
                for (int i = 0; i < node.get("statuses").size(); i++) {
                    if (i > 0) sb.append(", ");
                    sb.append(node.get("statuses").get(i).asText());
                }
                sb.append("\n\n");
            }
        }
        return sb.toString().replaceAll("(\n\\s*){3,}", "\n\n").trim();
    }

    /** 세션 조회 또는 생성 (사용자당 가장 최근 세션 사용) */
    private ChatSession getOrCreateSession(Integer userNo) {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return chatSessionRepository.findLatestByUserNo(userNo)
                .orElseGet(() -> chatSessionRepository.save(
                        ChatSession.builder().user(user).createdAt(LocalDateTime.now()).build()));
    }

    // 메시지 전송 및 응답 생성
    public ChatbotMessageResponse sendMessage(Integer userNo, ChatbotMessageRequest request) {
        ChatSession session = getOrCreateSession(userNo);

        // 사용자 메시지 저장
        ChatMessage userMsg = ChatMessage.builder()
                .session(session)
                .role("user")
                .content(request.getText())
                .createdAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(userMsg);

        // 해당 세션의 대화 히스토리 (시간순, 최근 10개만 사용)
        List<ChatMessage> historyAsc = chatMessageRepository.findBySession_SessionIdOrderByCreatedAtAsc(session.getSessionId());
        List<Map<String, String>> conversationHistory = new ArrayList<>();
        int start = Math.max(0, historyAsc.size() - 10);
        for (int i = start; i < historyAsc.size(); i++) {
            ChatMessage m = historyAsc.get(i);
            Map<String, String> entry = new HashMap<>();
            entry.put("role", m.getRole());
            entry.put("content", m.getContent());
            conversationHistory.add(entry);
        }

        // 가이드 즉답: 추천 질문·섹션 매칭 시 JSON 기반으로 바로 응답 (LLM 생략)
        String directAnswer = resolveDirectGuideAnswer(request.getTopic(), request.getText());
        if (directAnswer != null && !directAnswer.isBlank()) {
            ChatMessage botMsg = ChatMessage.builder()
                    .session(session)
                    .role("assistant")
                    .content(directAnswer)
                    .createdAt(LocalDateTime.now())
                    .build();
            ChatMessage saved = chatMessageRepository.save(botMsg);
            return ChatbotMessageResponse.builder()
                    .id(saved.getMessageId().longValue())
                    .type("bot")
                    .text(saved.getContent())
                    .timestamp(saved.getCreatedAt())
                    .build();
        }

        String guideContext = getGuideContextAsString(request.getTopic(), request.getText(), DEFAULT_MAX_GUIDE_CHARS);

        // OpenAI 응답 생성
        String botContent;
        try {
            botContent = openAIService.generateResponse(
                    request.getText(),
                    guideContext,
                    conversationHistory
            );
            if (botContent.contains("API 키가 설정되지 않았습니다") || botContent.contains("오류가 발생했습니다")) {
                botContent = generateBotResponse(request.getText());
            }
        } catch (Exception e) {
            System.err.println("OpenAI API 호출 실패, fallback 사용: " + e.getMessage());
            botContent = generateBotResponse(request.getText());
        }

        // 봇 메시지 저장
        ChatMessage botMsg = ChatMessage.builder()
                .session(session)
                .role("assistant")
                .content(botContent)
                .createdAt(LocalDateTime.now())
                .build();
        ChatMessage saved = chatMessageRepository.save(botMsg);

        return ChatbotMessageResponse.builder()
                .id(saved.getMessageId().longValue())
                .type("bot")
                .text(saved.getContent())
                .timestamp(saved.getCreatedAt())
                .build();
    }

    /** 스트리밍: 사용자 메시지 저장 후 LLM 스트림 Flux 반환. 완료 시 봇 메시지 저장은 호출측(Controller)에서 함. */
    public Flux<String> streamResponse(Integer userNo, ChatbotMessageRequest request) {
        ChatSession session = getOrCreateSession(userNo);
        ChatMessage userMsg = ChatMessage.builder()
                .session(session)
                .role("user")
                .content(request.getText())
                .createdAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(userMsg);

        List<ChatMessage> historyAsc = chatMessageRepository.findBySession_SessionIdOrderByCreatedAtAsc(session.getSessionId());
        List<Map<String, String>> conversationHistory = new ArrayList<>();
        int start = Math.max(0, historyAsc.size() - 10);
        for (int i = start; i < historyAsc.size(); i++) {
            ChatMessage m = historyAsc.get(i);
            Map<String, String> entry = new HashMap<>();
            entry.put("role", m.getRole());
            entry.put("content", m.getContent());
            conversationHistory.add(entry);
        }

        String directAnswer = resolveDirectGuideAnswer(request.getTopic(), request.getText());
        if (directAnswer != null && !directAnswer.isBlank()) {
            ChatMessage botMsg = ChatMessage.builder()
                    .session(session)
                    .role("assistant")
                    .content(directAnswer)
                    .createdAt(LocalDateTime.now())
                    .build();
            chatMessageRepository.save(botMsg);
            return Flux.just(directAnswer);
        }

        String guideContext = getGuideContextAsString(request.getTopic(), request.getText(), DEFAULT_MAX_GUIDE_CHARS);
        return openAIService.generateResponseStreaming(
                request.getText(),
                guideContext,
                conversationHistory
        );
    }

    /** 스트리밍 종료 시 클라이언트에 보낼 정규화된 전체 텍스트(띄어쓰기·줄바꿈 등) 반환. appendBotMessage 전에 한 번만 호출해 사용. */
    public String normalizeResponseTextForDisplay(String raw) {
        return openAIService.normalizeResponseText(raw != null ? raw : "");
    }

    /** 스트리밍 완료 후, 현재 세션에 봇 메시지 한 건 저장. 저장 전 마크다운 제거·문장 끝/띄어쓰기/줄바꿈 정리 */
    public void appendBotMessage(Integer userNo, String content) {
        String normalized = openAIService.normalizeResponseText(content != null ? content : "");
        ChatSession session = getOrCreateSession(userNo);
        ChatMessage botMsg = ChatMessage.builder()
                .session(session)
                .role("assistant")
                .content(normalized)
                .createdAt(LocalDateTime.now())
                .build();
        chatMessageRepository.save(botMsg);
    }

    // 메시지 히스토리 조회 (최신 세션 기준, 최신순)
    @Transactional(readOnly = true)
    public List<ChatbotMessageResponse> getMessageHistory(Integer userNo) {
        ChatSession session = chatSessionRepository.findLatestByUserNo(userNo).orElse(null);
        if (session == null) {
            return Collections.emptyList();
        }
        List<ChatMessage> list = chatMessageRepository.findBySession_SessionIdOrderByCreatedAtDesc(session.getSessionId());
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // 메시지 히스토리 삭제 (해당 사용자의 모든 채팅 세션 삭제 → CASCADE 로 메시지 삭제)
    public void clearMessageHistory(Integer userNo) {
        List<ChatSession> sessions = chatSessionRepository.findByUserNoOrderByCreatedAtDesc(userNo);
        chatSessionRepository.deleteAll(sessions);
    }

    private ChatbotMessageResponse toResponse(ChatMessage m) {
        String type = "assistant".equals(m.getRole()) ? "bot" : m.getRole();
        return ChatbotMessageResponse.builder()
                .id(m.getMessageId().longValue())
                .type(type)
                .text(m.getContent())
                .timestamp(m.getCreatedAt())
                .build();
    }

    private String generateBotResponse(String userMessage) {
        JsonNode guides = loadGuideData();
        String lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.contains("거주") || lowerMessage.contains("입주") ||
                lowerMessage.contains("주거비") || lowerMessage.contains("입주 상태")) {
            if (guides != null && guides.has("residency_management")) {
                JsonNode residency = guides.get("residency_management");
                if (lowerMessage.contains("주거비") || lowerMessage.contains("월세") || lowerMessage.contains("관리비")) {
                    JsonNode cost = residency.get("housing_cost");
                    if (cost != null) {
                        StringBuilder features = new StringBuilder();
                        if (cost.has("features") && cost.get("features").isArray()) {
                            for (JsonNode feature : cost.get("features")) {
                                features.append("• ").append(feature.asText()).append("\n");
                            }
                        }
                        StringBuilder tips = new StringBuilder();
                        if (cost.has("tips") && cost.get("tips").isArray()) {
                            for (JsonNode tip : cost.get("tips")) {
                                tips.append(tip.asText()).append(" ");
                            }
                        }
                        return "주거비 관리 기능은 가이드 기준으로 이렇게 정리돼 있어요.\n\n" + features + "\n" +
                                (tips.length() > 0 ? "참고: " + tips + "\n\n" : "") +
                                "세부 설정은 거주 관리 페이지에서 확인해 보시면 돼요.";
                    }
                } else if (lowerMessage.contains("입주 상태") || lowerMessage.contains("입주 기록")) {
                    JsonNode entry = residency.get("entry_status");
                    if (entry != null && entry.has("guide")) {
                        JsonNode guide = entry.get("guide");
                        StringBuilder steps = new StringBuilder();
                        if (guide.has("steps") && guide.get("steps").isArray()) {
                            for (JsonNode step : guide.get("steps")) {
                                steps.append("• ").append(step.asText()).append("\n");
                            }
                        }
                        String importance = guide.has("importance") ? guide.get("importance").asText() : "";
                        return "입주 시 촬영한 사진을 공간별로 분류해서 기록할 수 있어요.\n\n촬영 시 참고: " + steps + "중요한 점: " + importance;
                    }
                }
                return "거주 관리 페이지에서 계약 기간, 주거비, 입주 상태 기록, 거주 중 이슈를 볼 수 있어요. 궁금한 걸 골라서 질문해 주세요.";
            }
        }

        if (lowerMessage.contains("퇴실") || lowerMessage.contains("이사") ||
                lowerMessage.contains("보증금") || lowerMessage.contains("원상복구") || lowerMessage.contains("분쟁")) {
            if (guides != null && guides.has("moveout_management")) {
                JsonNode moveout = guides.get("moveout_management");
                if (lowerMessage.contains("보증금")) {
                    JsonNode deposit = moveout.get("deposit_management");
                    if (deposit != null) {
                        JsonNode obligation = deposit.get("return_obligation");
                        return String.format("가이드에는 보증금 반환이 이렇게 돼 있어요.\n\n%s\n\n합리적인 반환 기간: %s\n\n참고: %s",
                                obligation.get("description").asText(),
                                obligation.get("reasonable_period").asText(),
                                obligation.get("note").asText());
                    }
                } else if (lowerMessage.contains("분쟁") || lowerMessage.contains("도배") || lowerMessage.contains("장판") || lowerMessage.contains("주방")) {
                    if (moveout.get("dispute_prevention") != null) {
                        return "도배·장판 손상, 주방 설비 하자, TV·액자 흔적 같은 건 퇴실 관리 페이지의 '분쟁 예방 가이드'에서 자세히 볼 수 있어요.";
                    }
                } else if (lowerMessage.contains("체크리스트")) {
                    return "퇴실 체크리스트에는 전기·가스·수도 해지, 열쇠 반납, 우편물 주소 변경 같은 게 들어가요. 퇴실 관리 페이지에서 보시면 돼요.";
                }
                return "퇴실 체크리스트, 원상복구, 보증금, 분쟁 예방 가이드는 퇴실 관리 페이지에 있어요. 필요한 항목 골라서 질문해 주세요.";
            }
        }

        if (lowerMessage.contains("계약서") || lowerMessage.contains("계약")) {
            return "계약서 위험 조항은 계약서 점검 페이지에서 확인할 수 있어요. 궁금한 조항 있으면 말해 주세요.";
        }

        if (lowerMessage.contains("등기부등본") || lowerMessage.contains("등기")) {
            if (guides != null && guides.has("contract_guide")) {
                JsonNode contract = guides.get("contract_guide");
                if (contract.get("deed_analysis") != null) {
                    return "등기부등본 분석에서는 소유자 일치, 근저당·가압류, 소유권 이전 시점, 공동 소유 여부, 선순위 권리, 호실·목적물 특정 같은 걸 볼 수 있어요. 등기부등본 페이지에서 확인해 보시면 돼요.";
                }
            }
        }

        if (lowerMessage.contains("매물") || lowerMessage.contains("집 찾기")) {
            return "매물은 매물 찾기에서 지역·가격·옵션으로 검색할 수 있어요.";
        }

        return "입력해 주신 내용은 현재 제공 중인 계약서 점검 서비스와는 관련이 없어 정확한 안내가 어려운 점 양해 부탁드립니다.\n"
                + "계약서 점검과 관련된 궁금한 내용을 입력해 주시면 바로 안내해 드릴게요.";
    }
}
