# prompt_templates.py
from __future__ import annotations

from typing import Dict, List, Optional, Callable, TypeVar

from service_rag import LayeredRAGResult

T = TypeVar("T")


# -----------------------------
# Output schema (for your UI / API)
# -----------------------------
OUTPUT_FORMAT = """\
다음 형식으로만 답변하세요(마크다운 사용 가능). 매우 중요: 중복 금지.

## 1) 결론
- (한 줄 요약: 해당 특약의 리스크/유효성/주의점)

## 2) 리스크 포인트
- (핵심 쟁점 기본 3개 많다면 4개까지 허용, 각 항목은 짧게)

## 3) 관련 법령 근거
- 법령 항목은 1~3개
- 각 항목은 서로 중복되지 않게 작성
- 각 항목 끝에 출처 1회만 붙이기: [LAW:<doc_id>]
- 같은 [LAW:<doc_id>]를 여러 번 반복하지 말 것

## 4) 관련 판례 근거
- 판례 항목은 2개
- 각 판례는 "왜 중요한지"를 1~2문장으로 설명
- 반드시 제공된 [PRECEDENT_EVIDENCE] 문단을 인용/요약
- 각 항목 끝에 출처 1회만 붙이기: [PREC:<precedent_id>]
- 같은 [PREC:<precedent_id>]를 여러 번 반복하지 말 것

## 5) 분쟁조정사례 참고
- 조정사례 항목은 0~2개
- 유사 분쟁 패턴/결론을 요약하고 끝에 출처 1회만 붙이기: [MED:<doc_id>]
- 같은 [MED:<doc_id>]를 여러 번 반복하지 말 것
- 참고할 사례가 없으면 "해당 없음"이라고 명시

## 6) 실무 권장 문구(수정안)
- 특약을 더 안전하게 바꾸는 예시 문구 1~3개
- 단, 확정적 단정 대신 조건/예외를 명시

## 7) 불확실성 / 추가 확인 질문
- 사실관계가 부족하면 "추가 확인 질문" 2~5개
"""


# -----------------------------
# Prompt templates
# -----------------------------
SYSTEM_PROMPT = """\
너는 대한민국 주택 임대차(월세/전세) 계약서 특약 검토를 돕는 법률 보조 AI다.
너의 목표는:
- 입력 특약 문구가 어떤 법적 쟁점을 만들 수 있는지 설명하고,
- 관련 법령/판례/분쟁조정사례 근거를 근거 기반으로 제시하며,
- 사용자가 계약 문구를 더 안전하게 수정할 수 있도록 돕는 것이다.

중요 규칙:
1) 모르는 내용은 모른다고 말하고, 추측으로 단정하지 않는다.
2) 근거가 있는 내용만 말한다. 근거가 부족하면 "추가 확인 질문"으로 돌린다.
3) 반드시 제공된 컨텍스트(법령/판례/조정사례) 안에서만 인용/요약한다.
4) 출력에는 각 항목 끝에 출처 태그를 정확히 1회만 붙인다:
   - 법령: [LAW:<doc_id>]
   - 판례: [PREC:<precedent_id>]
   - 조정사례: [MED:<doc_id>]
   같은 출처 태그를 같은 섹션에서 반복하지 않는다(중복 금지).
5) 레이어 순서(법령 → 판례 → 조정사례)를 지켜서 서술한다.
6) 출력 지시(OUTPUT_FORMAT)의 섹션 구조를 깨지 말 것.
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
