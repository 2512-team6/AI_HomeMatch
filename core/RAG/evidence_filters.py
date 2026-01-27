# evidence_filters.py
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Optional

from evidence_extractor_bm25 import EvidenceSpan


# -----------------------------
# Paragraph heuristics
# -----------------------------
# 형식 문단(표지/당사자/주문/청구취지 등) 패턴
_FORMAL_PATTERNS = [
    r"^\s*【\s*원고",
    r"^\s*【\s*피고",
    r"^\s*【\s*상고인",
    r"^\s*【\s*피상고인",
    r"^\s*【\s*항소인",
    r"^\s*【\s*피항소인",
    r"^\s*【\s*원심판결",
    r"^\s*【\s*주\s*문",
    r"^\s*【\s*본소청구취지",
    r"^\s*【\s*반소청구취지",
    r"^\s*【\s*청구\s*및\s*항소취지",
    r"^\s*【\s*청구취지",
    r"^\s*【\s*항소취지",
    r"^\s*사\s*건\s*명",
    r"^\s*사\s*건\s*번\s*호",
]

# 실질(법리/판단/조문) 가산 패턴
_SUBSTANCE_PATTERNS = [
    r"【\s*이\s*유\s*】",  # 문단 안에 이유가 포함되면 강한 신호
    r"민법\s*제\s*\d+조",
    r"주택임대차보호법\s*제\s*\d+조",
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


def has_reason_marker(text: str) -> bool:
    return bool(_REASON_RE.search((text or "")))


def formal_penalty(text: str) -> float:
    """
    형식 문단이면 감점(제거 X).
    단, 문단 안에 '【이 유】'가 있으면 형식으로 보지 않음.
    """
    t = (text or "").strip()
    if not t:
        return 10.0  # 사실상 제거와 유사한 강한 감점

    # 이유 표식이 포함되면 살린다 (형식 감점 없음)
    if has_reason_marker(t):
        return 0.0

    # 너무 짧은 문단은 형식일 확률이 높음
    if len(t) < 35:
        return 2.0

    if any(rx.search(t) for rx in _formal_res):
        return 1.5

    return 0.0


def substance_bonus(text: str) -> float:
    """
    실질 문단이면 점수 가산.
    """
    t = (text or "").strip()
    if not t:
        return 0.0

    bonus = 0.0
    for rx in _substance_res:
        if rx.search(t):
            bonus += 0.25

    # '【이 유】' 포함은 추가 가산(법리/판단 영역일 확률이 높음)
    if has_reason_marker(t):
        bonus += 0.75

    return min(3.0, bonus)


# -----------------------------
# Public API
# -----------------------------
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
    """
    - 기본은 drop_formal=False (완전 제거 대신 감점)
    - adjusted = bm25 + bonus - penalty
    - 만약 필터링 결과가 비면, 원본에서 상위 keep_top_if_empty개는 구제
      (76504 같은 '헤드노트는 최적인데 전문이 절차문단 위주로 쪼개진' 케이스 방지)
    """
    out: List[ScoredEvidence] = []

    for s in spans:
        if drop_formal and formal_penalty(s.text) > 0:
            continue

        adj = float(s.score) + substance_bonus(s.text) - formal_penalty(s.text)
        if adj < min_adjusted_score:
            continue
        out.append(ScoredEvidence(span=s, adjusted_score=adj))

    out.sort(key=lambda x: x.adjusted_score, reverse=True)

    # 결과가 비어버리면, BM25 상위 몇 개는 살려서 근거 0개 상황 방지
    if not out and keep_top_if_empty > 0 and spans:
        spans_sorted = sorted(spans, key=lambda x: x.score, reverse=True)[
            :keep_top_if_empty
        ]
        out = [
            ScoredEvidence(span=s, adjusted_score=float(s.score)) for s in spans_sorted
        ]

    return out
