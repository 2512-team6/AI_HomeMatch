# prompt_templates.py
from __future__ import annotations

from typing import Dict, List, Optional, Callable, TypeVar

from .service_rag import LayeredRAGResult

T = TypeVar("T")


# -----------------------------
# Output schema (for your UI / API) — 레벨 3단계: SAFE | NEED_UNDERSTAND | NEED_REVIEW
# -----------------------------
OUTPUT_FORMAT = """\
Your entire response must be exactly one JSON object. Do not write any introduction, explanation, key: value lines, or other text before or after the JSON. No markdown, no code fences.

Return ONLY that single JSON object. Keys are fixed in English. All string values (conclusion, risk_points, recommendations, summaries) must be written in Korean using only the Korean alphabet (한글). Do not use Chinese characters (한자) or Japanese (히라가나, 가타카나, or 漢字).

Use EXACT keys and types below. Do not add new keys.

{
  "level": "SAFE | NEED_UNDERSTAND | NEED_REVIEW",
  "color": "green | yellow | orange",

  "conclusion": "string (Korean, 1-2 sentences, easy for general adults)",

  "risk_points": ["string"],

  "mediation_cases": [
    { "summary": "string (Korean)", "source_id": "MED:<doc_id>" }
  ],
  "mediation_case_ids": ["MED:<doc_id>"],

  "precedents": [
    {
      "summary": "string (Korean)",
      "source_id": "PREC:<precedent_id>",
      "evidence_paragraphs": ["string (Korean, taken from PRECEDENT_EVIDENCE only)"]
    }
  ],
  "precedent_ids": ["PREC:<precedent_id>"],

  "laws": [
    { "summary": "string (Korean)", "source_id": "LAW:<doc_id>" }
  ],
  "law_ids": ["LAW:<doc_id>"],

  "recommendations": ["string (Korean)"]
}

Rules:
- JSON must be parseable by json.loads.
- source_id: Every value MUST appear exactly as in the context blocks (e.g. LAW:law:13, PREC:421472, MED:mediation:7). Do NOT invent or guess IDs. If the exact id is not in the context, omit that source.
- If the provided context is empty or insufficient for a confident conclusion, set level to SAFE or NEED_UNDERSTAND and use empty arrays [] for mediation_cases, precedents, laws and their _ids. Do not fill with invented sources.
- precedents[].evidence_paragraphs MUST be quotes or close paraphrases from [PRECEDENT_EVIDENCE] only. If you have no such paragraph for a case, do not include that case in precedents.
- When unsure between two levels, choose the lower risk level (SAFE over NEED_UNDERSTAND, NEED_UNDERSTAND over NEED_REVIEW).
- Limits:
  - risk_points: 0~3 items.
  - mediation_cases: 0~2 items; mediation_case_ids must match.
  - precedents: 0~2 items; precedent_ids must match.
  - laws: 0~3 items; law_ids must match.
  - recommendations: If level is SAFE or NEED_UNDERSTAND, MUST be []. If NEED_REVIEW: 0~2 items.
- Level guidance:
  - SAFE: Evidence is insufficient OR no meaningful risk found.
  - NEED_UNDERSTAND: May confuse parties; mediation may exist; laws/precedents not required.
  - NEED_REVIEW: Clause may materially affect rights/obligations AND there is meaningful supporting context; include available sources and up to 2 recommendations.
- Color mapping: SAFE -> green, NEED_UNDERSTAND -> yellow, NEED_REVIEW -> orange.
"""


# -----------------------------
# Prompt templates
# -----------------------------
SYSTEM_PROMPT = """\
너는 대한민국 주택 임대차(월세/전세) 계약서 특약 검토를 돕는 법률 보조 AI다.

목표:
- 입력된 **특약 문구 한 덩어리**의 의미와 쟁점을 일반인이 이해하기 쉽게 설명한다.
- 반드시 [참고 컨텍스트]에만 있는 법령·판례·분쟁조정사례를 근거로 사용한다.
- 모든 특약이 수정 대상은 아니며, 근거가 부족하면 보수적으로 판단한다.

중요 규칙:
1) 모르는 내용은 단정하지 않고, 추측으로 근거를 만들지 않는다.
2) 근거가 없거나 컨텍스트가 비어 있으면, level은 SAFE 또는 NEED_UNDERSTAND로 두고 결론만 짧게 쓰며, laws/precedents/mediation_cases는 반드시 빈 배열 []로 둔다.
3) 인용·요약은 오직 제공된 [LAW], [PRECEDENT_HEADNOTE], [PRECEDENT_EVIDENCE], [MEDIATION] 블록 안의 문장만 사용한다. 컨텍스트에 없는 source_id를 절대 만들지 않는다.
4) precedents[].evidence_paragraphs는 [PRECEDENT_EVIDENCE]에 나온 문단만 인용·요약한다. [PRECEDENT_HEADNOTE]만 보고 문단을 지어내지 않는다.
5) 레이어 순서(법령 → 판례 → 조정사례)를 지킨다.
6) 출력은 반드시 주어진 출력 지시(JSON 스키마)의 키와 구조를 따른다. conclusion, risk_points, recommendations는 간결하게 써서 잘림을 피한다.
7) 응답 전체는 반드시 하나의 JSON 객체만 출력한다. JSON 앞뒤에 설명문, 요약, "level: ..." 같은 키:값 나열, 마크다운 등 어떤 추가 텍스트도 붙이지 않는다.
8) conclusion, risk_points, recommendations, summary, evidence_paragraphs 등 사용자에게 보이는 모든 문장은 한글로만 쓴다. 한자(漢字)나 일본어를 사용하지 않는다. 예: "임차인" O, "임차人" X.

입력 범위:
- 입력은 "한 건의 특약 문구"가 아니면(예: 법령 전문, "이 조항은 무효로 해달라" 같은 요청) level은 SAFE, conclusion에 "특약 문구만 입력해 주세요"라고 안내하고, 모든 근거 배열은 []로 둔다.
"""

USER_PROMPT_TEMPLATE = """\
[입력 특약 문구]
{clause_text}

[참고 컨텍스트]
{context_block}

[출력 지시]
{output_format}
"""


# -----------------------------
# Helpers
# -----------------------------
def _snip(text: str, n: int) -> str:
    t = (text or "").strip()
    if len(t) <= n:
        return t
    return t[:n] + "..."


def _dedupe_keep_order(items: List[T], key_fn: Callable[[T], str]) -> List[T]:
    seen = set()
    out: List[T] = []
    for it in items:
        k = (key_fn(it) or "").strip()
        if not k:
            # 키가 비면 일단 살림
            out.append(it)
            continue
        if k in seen:
            continue
        seen.add(k)
        out.append(it)
    return out


def format_law_block(result: LayeredRAGResult, *, max_chars_per_hit: int = 900) -> str:
    # ✅ doc_id 기준 중복 제거
    hits = _dedupe_keep_order(
        result.law_hits,
        key_fn=lambda h: (h.doc.metadata or {}).get("doc_id")
        or (h.doc.metadata or {}).get("parent_doc_id")
        or "",
    )

    lines: List[str] = []
    for h in hits:
        meta = h.doc.metadata or {}
        doc_id = meta.get("doc_id") or meta.get("parent_doc_id") or "unknown"
        title = meta.get("title") or ""
        source_name = meta.get("source_name") or ""

        # ✅ 모델이 distance/스코어를 따라 말하며 반복하는 경우가 많아서 제거
        header = f"- {title} ({source_name}) [LAW:{doc_id}]".strip()
        lines.append(header)

        text = _snip(h.doc.page_content, max_chars_per_hit).replace("\n", " ")
        lines.append(f"  {text}")

    return "\n".join(lines).strip()


def format_precedent_headnote_block(
    result: LayeredRAGResult, *, max_chars_per_hit: int = 700
) -> str:
    # ✅ precedent_id 기준 중복 제거
    hits = _dedupe_keep_order(
        result.precedent_headnote_hits, key_fn=lambda h: str(h.precedent_id)
    )

    lines: List[str] = []
    for h in hits:
        pid = h.precedent_id
        # ✅ 핵심 메타만
        header = f"- {h.case_name} / {h.case_number} / {h.decision_date} [PREC:{pid}]"
        lines.append(header)

        text = _snip(h.doc.page_content, max_chars_per_hit).replace("\n", " ")
        lines.append(f"  {text}")

    return "\n".join(lines).strip()


def format_precedent_evidence_block(
    result: LayeredRAGResult,
    *,
    max_cases: int = 3,
    max_paragraphs_per_case: int = 1,
    max_chars_per_paragraph: int = 700,
) -> str:
    """
    ✅ 케이스별 1문단(기본) + 최대 케이스 수 제한으로 토큰/중복 리스크를 낮춤.
    """
    lines: List[str] = []
    case_count = 0

    for pid, ranked in result.precedent_evidence.items():
        if not ranked:
            continue

        case_count += 1
        if case_count > max_cases:
            break

        rec = result.precedent_fulltext.get(pid)
        case_name = getattr(rec, "case_name", None) if rec else None
        header = f"- {case_name or '판례'} [PREC:{pid}]"
        lines.append(header)

        for i, item in enumerate(ranked[:max_paragraphs_per_case], start=1):
            ev = item.span
            ev_text = _snip(ev.text, max_chars_per_paragraph).replace("\n", " ")
            lines.append(f"  - 근거문단 {i}: {ev_text}")

    return "\n".join(lines).strip()


def format_mediation_block(
    result: LayeredRAGResult, *, max_chars_per_hit: int = 900
) -> str:
    # ✅ doc_id 기준 중복 제거
    hits = _dedupe_keep_order(
        result.mediation_hits,
        key_fn=lambda h: (h.doc.metadata or {}).get("doc_id")
        or (h.doc.metadata or {}).get("parent_doc_id")
        or "",
    )

    lines: List[str] = []
    for h in hits:
        meta = h.doc.metadata or {}
        doc_id = meta.get("doc_id") or meta.get("parent_doc_id") or "unknown"
        title = meta.get("title") or ""
        source_name = meta.get("source_name") or ""

        header = f"- {title} ({source_name}) [MED:{doc_id}]".strip()
        lines.append(header)

        text = _snip(h.doc.page_content, max_chars_per_hit).replace("\n", " ")
        lines.append(f"  {text}")

    return "\n".join(lines).strip()


def build_context_block(
    result: LayeredRAGResult,
    *,
    law_max_chars_per_hit: int = 900,
    precedent_headnote_max_chars_per_hit: int = 700,
    evidence_max_cases: int = 3,
    evidence_max_paragraphs_per_case: int = 1,
    evidence_max_chars_per_paragraph: int = 700,
    mediation_max_chars_per_hit: int = 900,
) -> str:
    parts: List[str] = []

    law = format_law_block(result, max_chars_per_hit=law_max_chars_per_hit)
    if law:
        parts.append("[LAW]\n" + law)

    prec_head = format_precedent_headnote_block(
        result, max_chars_per_hit=precedent_headnote_max_chars_per_hit
    )
    if prec_head:
        parts.append("[PRECEDENT_HEADNOTE]\n" + prec_head)

    prec_ev = format_precedent_evidence_block(
        result,
        max_cases=evidence_max_cases,
        max_paragraphs_per_case=evidence_max_paragraphs_per_case,
        max_chars_per_paragraph=evidence_max_chars_per_paragraph,
    )
    if prec_ev:
        parts.append("[PRECEDENT_EVIDENCE]\n" + prec_ev)

    med = format_mediation_block(result, max_chars_per_hit=mediation_max_chars_per_hit)
    if med:
        parts.append("[MEDIATION]\n" + med)

    return "\n\n".join(parts).strip()


def build_messages_for_llm(
    result: LayeredRAGResult,
    *,
    output_format: str = OUTPUT_FORMAT,
) -> List[Dict[str, str]]:
    """
    LangChain 안 쓰는 경우에도 그대로 쓸 수 있게 OpenAI/Groq 스타일 메시지 리스트로 제공.
    """
    context_block = build_context_block(result)

    user_prompt = USER_PROMPT_TEMPLATE.format(
        clause_text=result.clause_text,
        context_block=context_block,
        output_format=output_format,
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]
