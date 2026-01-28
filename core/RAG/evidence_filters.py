# evidence_filters.py
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List

from evidence_extractor_bm25 import EvidenceSpan


_FORMAL_PATTERNS = [
    r"^\s*【\s*원고",
    r"^\s*【\s*피고",
    r"^\s*【\s*상고인",
    r"^\s*【\s*피상고인",
    r"^\s*【\s*항소인",
    r"^\s*【\s*피항소인",
    r"^\s*【\s*원심판결",
    # r"^\s*【\s*주\s*문",  # ✅ 주문은 별도 완화 처리(아래에서)
    r"^\s*【\s*본소청구취지",
    r"^\s*【\s*반소청구취지",
    r"^\s*【\s*청구\s*및\s*항소취지",
    r"^\s*【\s*청구취지",
    r"^\s*【\s*항소취지",
    r"^\s*사\s*건\s*명",
    r"^\s*사\s*건\s*번\s*호",
]

_SUBSTANCE_PATTERNS = [
    r"【\s*이\s*유\s*】",
    # ✅ 판례 구조 신호(헤드노트/요약 근거 강화)
    r"【\s*판시사항\s*】",
    r"【\s*판결요지\s*】",
    r"【\s*참조조문\s*】",
    r"【\s*참조판례\s*】",
    # 법령 언급
    r"민법\s*제\s*\d+조",
    r"주택임대차보호법\s*제\s*\d+조",
    # 판단/법리 시그널
    r"대법원",
    r"판시",
    r"법리",
    r"따라서",
    r"그러므로",
    r"위법",
    r"해지",
    r"전대",
    r"양도",
]

_formal_res = [re.compile(p) for p in _FORMAL_PATTERNS]
_substance_res = [re.compile(p) for p in _SUBSTANCE_PATTERNS]

_REASON_RE = re.compile(r"【\s*이\s*유\s*】")
_ORDER_RE = re.compile(r"^\s*【\s*주\s*문\s*】")


def has_reason_marker(text: str) -> bool:
    return bool(_REASON_RE.search((text or "")))


def formal_penalty(text: str) -> float:
    t = (text or "").strip()
    if not t:
        return 10.0

    if has_reason_marker(t):
        return 0.0

    if len(t) < 35:
        return 2.0

    # ✅ 주문은 완화: 완전 형식 취급은 아니지만 본문보단 약하니 약한 감점만
    if _ORDER_RE.search(t):
        return 0.75

    if any(rx.search(t) for rx in _formal_res):
        return 1.5

    return 0.0


def substance_bonus(text: str) -> float:
    t = (text or "").strip()
    if not t:
        return 0.0

    bonus = 0.0
    for rx in _substance_res:
        if rx.search(t):
            bonus += 0.25

    if has_reason_marker(t):
        bonus += 0.75

    return min(3.0, bonus)


@dataclass(frozen=True)
class ScoredEvidence:
    span: EvidenceSpan
    adjusted_score: float


def rerank_and_filter_evidence(
    spans: List[EvidenceSpan],
    *,
    drop_formal: bool = False,
    min_adjusted_score: float = 0.0,
    keep_top_if_empty: int = 1,
) -> List[ScoredEvidence]:
    out: List[ScoredEvidence] = []

    for s in spans:
        if drop_formal and formal_penalty(s.text) > 0:
            continue

        adj = float(s.score) + substance_bonus(s.text) - formal_penalty(s.text)
        if adj < min_adjusted_score:
            continue
        out.append(ScoredEvidence(span=s, adjusted_score=adj))

    out.sort(key=lambda x: x.adjusted_score, reverse=True)

    if not out and keep_top_if_empty > 0 and spans:
        spans_sorted = sorted(spans, key=lambda x: x.score, reverse=True)[
            :keep_top_if_empty
        ]
        out = [
            ScoredEvidence(span=s, adjusted_score=float(s.score)) for s in spans_sorted
        ]

    return out
