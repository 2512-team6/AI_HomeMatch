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
import java.util.Comparator;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
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
    /** 질문 관련 섹션만 추려 넣을 때 최대 섹션 수 */
    private static final int MAX_RELEVANT_SECTIONS = 8;
    /** 띄어쓰기 없는 질문 대비: 2-gram 최대 추가 개수 */
    private static final int MAX_BIGRAM_TOKENS = 40;

    /** 도메인(사이트 관련) 질문 키워드: 주거/임대차/서비스 사용법 전반 */
    private static final Pattern IN_SCOPE_KEYWORDS = Pattern.compile(
            "전세|월세|임대|임차|임대인|임차인|세입자|집주인|보증금|계약|계약서|특약|중개|중개사|" +
            "등기|등기부|근저당|가압류|권리|소유자|매물|집|방|원룸|오피스텔|아파트|빌라|반지하|" +
            "입주|퇴실|이사|이삿짐|원상복구|하자|누수|곰팡|결로|악취|냄새|오염|얼룩|변색|벽지|벽|바닥|파손|분쟁|창문|오줌|소변|" +
            "관리비|공과금|전기|가스|수도|열쇠|주소변경|내용증명|지급명령|" +
            "로그인|회원가입|비밀번호|계정|마이페이지|페이지|기능|사용법|홈스캔|homesc?an|homematch");

    /** 명확한 도메인 밖(차단) 키워드: 주식/정치/연예/건강 등 */
    private static final Pattern OUT_OF_SCOPE_KEYWORDS = Pattern.compile(
            "주식|코인|비트코인|가상화폐|투자|재테크|정치|대선|총선|국회|대통령|" +
            "연예|아이돌|배우|가수|드라마|영화|스포츠|축구|야구|농구|게임|" +
            "날씨|기온|미세먼지|요리|레시피|다이어트|운동|헬스|건강|질병|약|병원|연애|" +
            "메뉴|뭐먹|뭐\\s*먹|추천해|추천\\s*해|잡담|심심");

    /** 사용자의 질문이 Home'Scan 도메인(사이트 관련)인지 판단 */
    private boolean isInScope(String topic, String userText) {
        // UI에서 topic이 명시돼서 들어오는 경우(거주/퇴실/계약 등)에는 인스코프로 취급
        if (topic != null && !topic.isBlank()) return true;
        if (userText == null || userText.isBlank()) return false;

        String normalized = userText.toLowerCase().replaceAll("\\s+", "");
        boolean in = IN_SCOPE_KEYWORDS.matcher(normalized).find();
        boolean out = OUT_OF_SCOPE_KEYWORDS.matcher(normalized).find();
        if (in) return true;
        // 명확히 도메인 밖 단어만 있고 인스코프 단서가 없으면 차단
        if (out && !in) return false;
        // 애매한 경우는 우선 통과시켜 LLM이 답하도록 (사이트 관련 질문 누락 방지)
        return true;
    }

    /** Controller 등 외부에서 인스코프 여부 확인용 */
    boolean isInScopeForChatbot(String topic, String userText) {
        return isInScope(topic, userText);
    }

    /** 고정 문구와 동일한지(공백 무시) 판단 */
    boolean isOffTopicFinalText(String text) {
        if (text == null) return false;
        String a = text.replaceAll("\\s+", "");
        String b = openAIService.offTopicMessage().replaceAll("\\s+", "");
        return !a.isBlank() && a.contains(b);
    }

    /**
     * 스트리밍 최종이 고정 문구로 끝났을 때, 인스코프라면 비스트리밍으로 한 번 더 생성해 반환.
     * (사용자 메시지는 이미 streamResponse에서 저장되었으므로 여기서는 저장하지 않음)
     */
    String regenerateFinalAnswer(Integer userNo, ChatbotMessageRequest request) {
        ChatSession session = getOrCreateSession(userNo);

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

        String guideContext = getGuideContextAsString(request.getTopic(), request.getText(), DEFAULT_MAX_GUIDE_CHARS);
        return openAIService.generateResponse(
                request.getText(),
                guideContext,
                conversationHistory,
                true
        );
    }

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
            Set<String> tokens = extractTokens(userMessage);
            if (!tokens.isEmpty()) {
                JsonNode reduced = reduceGuideByRelevance(target, tokens);
                if (reduced != null) {
                    target = reduced;
                } else {
                    // 키워드 매칭이 안 되더라도, 흔한 생활/하자/오염 같은 케이스는 관련 기능 섹션을 우선 주입
                    JsonNode hinted = selectGuideByHeuristics(topic, guides, userMessage);
                    if (hinted != null) {
                        target = hinted;
                    }
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

    /**
     * 키워드 기반 휴리스틱 라우팅.
     * - 질문이 "청소/오염 해결 방법"처럼 가이드에 정확 매칭이 없더라도,
     *   앱 내에서 할 수 있는 "기록/증거/소통" 기능 섹션을 우선 넣어 LLM이 도움이 되는 답을 하게 유도.
     *
     * 반환:
     * - 선택된 섹션만 담은 ObjectNode (null이면 미적용)
     */
    private JsonNode selectGuideByHeuristics(String topic, JsonNode guides, String userMessage) {
        if (guides == null || userMessage == null) return null;
        String m = userMessage.replaceAll("\\s+", "").toLowerCase();
        if (m.isBlank()) return null;

        boolean looksLikeDefectOrDamage =
                containsAny(m, "하자", "누수", "곰팡", "결로", "파손", "깨졌", "금갔", "오염", "냄새", "악취", "오줌", "소변", "똥", "변", "찌든", "누래", "변색", "얼룩", "벽지", "벽", "바닥");
        if (!looksLikeDefectOrDamage) return null;

        // topic이 명시된 경우: 그 범위에서만 선택
        String key = topic == null ? "" : topic.trim().toLowerCase();

        // 1) residency: 거주 중 이슈 기록 + 입주 상태 기록(증거)
        if ("residency".equals(key) && guides.has("residency_management")) {
            JsonNode r = guides.get("residency_management");
            if (r != null && r.isObject()) {
                var out = objectMapper.createObjectNode();
                if (r.has("defect_issues")) out.set("defect_issues", r.get("defect_issues"));
                if (r.has("entry_status")) out.set("entry_status", r.get("entry_status"));
                return out.size() > 0 ? out : null;
            }
        }

        // 2) moveout: 분쟁 예방 + 입주 기록/원상복구 체크리스트
        if ("moveout".equals(key) && guides.has("moveout_management")) {
            JsonNode mo = guides.get("moveout_management");
            if (mo != null && mo.isObject()) {
                var out = objectMapper.createObjectNode();
                if (mo.has("dispute_prevention")) out.set("dispute_prevention", mo.get("dispute_prevention"));
                if (mo.has("entry_records")) out.set("entry_records", mo.get("entry_records"));
                if (mo.has("restoration_checklist")) out.set("restoration_checklist", mo.get("restoration_checklist"));
                return out.size() > 0 ? out : null;
            }
        }

        // 3) topic이 없거나 기타: 우선 residency 기능(이슈 기록/입주 상태 기록)로 안내하는 게 가장 실무적으로 유용
        if (guides.has("residency_management")) {
            JsonNode r = guides.get("residency_management");
            if (r != null && r.isObject()) {
                var out = objectMapper.createObjectNode();
                if (r.has("defect_issues")) out.set("defect_issues", r.get("defect_issues"));
                if (r.has("entry_status")) out.set("entry_status", r.get("entry_status"));
                return out.size() > 0 ? out : null;
            }
        }

        return null;
    }

    private boolean containsAny(String haystack, String... needles) {
        if (haystack == null || haystack.isEmpty() || needles == null) return false;
        for (String n : needles) {
            if (n == null || n.isBlank()) continue;
            if (haystack.contains(n)) return true;
        }
        return false;
    }

    /** userMessage 토큰과 겹치는 필드만 남긴 서브트리. 없으면 null(전체 유지) */
    private JsonNode reduceGuideByRelevance(JsonNode node, Set<String> tokens) {
        if (!node.isObject()) return null;
        // top-level 섹션별로 score를 계산해서 상위 K개만 포함 (컨텍스트 과대/노이즈 방지)
        List<Map.Entry<String, Integer>> scored = new ArrayList<>();
        for (var it = node.fields(); it.hasNext(); ) {
            var e = it.next();
            String k = e.getKey();
            String hay = k + " " + e.getValue().toString();
            int score = 0;
            for (String t : tokens) {
                if (t == null || t.isBlank()) continue;
                if (hay.contains(t)) score += Math.min(5, t.length());
            }
            if (score > 0) scored.add(Map.entry(k, score));
        }
        if (scored.isEmpty()) return null;
        if (scored.size() == node.size()) return node;

        scored.sort(Comparator.comparingInt((Map.Entry<String, Integer> e) -> e.getValue()).reversed());
        List<String> keep = new ArrayList<>();
        int limit = Math.min(MAX_RELEVANT_SECTIONS, scored.size());
        for (int i = 0; i < limit; i++) {
            keep.add(scored.get(i).getKey());
        }
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

    /** 유사도 매칭용 정규화: 공백/구두점 제거 + 소문자 */
    private String normalizeForMatch(String text) {
        if (text == null) return "";
        String s = text.toLowerCase();
        // 공백 및 구두점 제거 (간단 유사도 비교용)
        s = s.replaceAll("[\\s\\p{Punct}]+", "");
        return s.trim();
    }

    /**
     * 간단 토큰화.
     * - 기본: 공백 기준 2글자 이상 토큰
     * - 띄어쓰기 없는 질문(예: "퇴실시이사는언제") 대비: bigram(2글자) 토큰을 제한적으로 추가
     */
    private Set<String> extractTokens(String text) {
        if (text == null) return Collections.emptySet();
        String normalized = text.replaceAll("\\s+", " ").trim();
        Set<String> tokens = Stream.of(normalized.split(" "))
                .map(String::trim)
                .filter(s -> s.length() >= 2)
                .collect(Collectors.toSet());

        if (tokens.isEmpty()) {
            String noSpace = normalized.replace(" ", "");
            if (noSpace.length() >= 2) {
                int added = 0;
                for (int i = 0; i < noSpace.length() - 1 && added < MAX_BIGRAM_TOKENS; i++) {
                    String bi = noSpace.substring(i, i + 2);
                    if (bi.isBlank()) continue;
                    if (tokens.add(bi)) added++;
                }
            }
        }
        return tokens;
    }

    private int countTokenOverlap(Set<String> a, Set<String> b) {
        if (a == null || b == null || a.isEmpty() || b.isEmpty()) return 0;
        int c = 0;
        // 작은 쪽을 순회
        Set<String> small = a.size() <= b.size() ? a : b;
        Set<String> large = a.size() <= b.size() ? b : a;
        for (String t : small) {
            if (large.contains(t)) c++;
        }
        return c;
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
        String userNorm = normalizeForMatch(trim);
        Set<String> userTokens = extractTokens(trim);

        String sectionPath = null;
        int bestScore = 0;

        for (JsonNode item : sq.get(key)) {
            if (!item.has("label") || !item.has("section")) continue;
            String label = item.get("label").asText("").trim();
            String sec = item.get("section").asText("").trim();
            if (label.isBlank() || sec.isBlank()) continue;

            // 1) 완전 일치
            if (label.equals(trim)) {
                sectionPath = sec;
                bestScore = Integer.MAX_VALUE;
                break;
            }

            // 2) 정규화 후 포함 관계(강한 매칭)
            String labelNorm = normalizeForMatch(label);
            int score = 0;
            if (!userNorm.isBlank() && !labelNorm.isBlank()) {
                if (userNorm.equals(labelNorm)) score += 1000;
                else if (userNorm.contains(labelNorm) || labelNorm.contains(userNorm)) score += 600;
            }

            // 3) 토큰 겹침(약한 매칭)
            Set<String> labelTokens = extractTokens(label);
            int overlap = countTokenOverlap(userTokens, labelTokens);
            double ratio = labelTokens.isEmpty() ? 0.0 : (double) overlap / (double) labelTokens.size();
            if (overlap > 0) score += overlap * 50;
            if (ratio >= 0.6) score += 200;

            // 오탐 방지: 최소 조건
            boolean ok = score >= 200 || overlap >= 2 || ratio >= 0.6;
            if (ok && score > bestScore) {
                bestScore = score;
                sectionPath = sec;
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

        // 도메인 밖 질문은 서버에서 즉시 차단 (LLM 호출/비용 방지)
        if (!isInScope(request.getTopic(), request.getText())) {
            String blocked = openAIService.offTopicMessage();
            ChatMessage botMsg = ChatMessage.builder()
                    .session(session)
                    .role("assistant")
                    .content(blocked)
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
                    conversationHistory,
                    true
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

        // 도메인 밖 질문은 즉시 차단 (스트리밍도 LLM 호출 없이 종료)
        if (!isInScope(request.getTopic(), request.getText())) {
            return Flux.just(openAIService.offTopicMessage());
        }

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
                conversationHistory,
                true
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

        return openAIService.offTopicMessage();
    }
}
