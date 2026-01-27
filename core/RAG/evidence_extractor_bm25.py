# evidence_extractor_bm25.py
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional

from precedent_repo import PrecedentRecord


# -----------------------------
# Tokenize / split helpers
# -----------------------------
_WORD_RE = re.compile(r"[0-9A-Za-z가-힣]+")


def tokenize_ko(text: str) -> List[str]:
    """
    아주 단순 토크나이저.
    - 한국어/영문/숫자 덩어리 기준
    - 법률 텍스트는 키워드 매칭이 꽤 잘 먹히므로 이 정도로도 1차 근거 추출 가능
    """
    return _WORD_RE.findall((text or "").lower())


def split_paragraphs(full_text: str) -> List[str]:
    """
    판례 전문은 <br/> 같은 HTML이 섞여 있을 수 있으니 문단 경계로 활용.
    - <br/>/줄바꿈/빈줄 등을 문단 경계로 사용
    """
    if not full_text:
        return []
    t = full_text.replace("<br/>", "\n").replace("<br />", "\n")
    # 빈 줄 기준으로 1차 분리
    raw = re.split(r"\n\s*\n+", t)
    paras = [p.strip() for p in raw if p and p.strip()]
    return paras


# -----------------------------
# Minimal BM25
# -----------------------------
@dataclass(frozen=True)
class EvidenceSpan:
    precedent_id: str
    paragraph_index: int
    score: float
    text: str


@dataclass(frozen=True)
class BM25Index:
    paragraphs: List[str]
    doc_tokens: List[List[str]]
    df: Dict[str, int]
    avgdl: float
    k1: float = 1.2
    b: float = 0.75

    @property
    def N(self) -> int:
        return len(self.paragraphs)

    def idf(self, term: str) -> float:
        # BM25 IDF (Okapi)
        df = self.df.get(term, 0)
        return math.log(1 + (self.N - df + 0.5) / (df + 0.5))

    def score(self, query_tokens: List[str], doc_idx: int) -> float:
        tokens = self.doc_tokens[doc_idx]
        if not tokens:
            return 0.0

        dl = len(tokens)
        tf: Dict[str, int] = {}
        for w in tokens:
            tf[w] = tf.get(w, 0) + 1

        score = 0.0
        for q in query_tokens:
            f = tf.get(q, 0)
            if f == 0:
                continue
            idf = self.idf(q)
            denom = f + self.k1 * (1 - self.b + self.b * (dl / (self.avgdl or 1.0)))
            score += idf * (f * (self.k1 + 1) / (denom or 1.0))
        return score


def build_bm25_index(paragraphs: List[str]) -> BM25Index:
    doc_tokens: List[List[str]] = []
    df: Dict[str, int] = {}

    total_len = 0
    for p in paragraphs:
        toks = tokenize_ko(p)
        doc_tokens.append(toks)
        total_len += len(toks)

        # df는 문서(문단) 단위 등장 여부
        seen = set(toks)
        for w in seen:
            df[w] = df.get(w, 0) + 1

    avgdl = total_len / max(1, len(paragraphs))
    return BM25Index(
        paragraphs=paragraphs,
        doc_tokens=doc_tokens,
        df=df,
        avgdl=avgdl,
    )


# -----------------------------
# Public API
# -----------------------------
def extract_evidence_bm25(
    clause_text: str,
    precedents: List[PrecedentRecord],
    *,
    top_n_per_case: int = 3,
    min_paragraph_chars: int = 40,
) -> Dict[str, List[EvidenceSpan]]:
    """
    판례별 full_text에서 clause_text와 관련 높은 문단을 top_n_per_case 만큼 추출.

    return:
      { precedent_id: [EvidenceSpan, ...] }
    """
    q_tokens = tokenize_ko(clause_text)
    if not q_tokens:
        return {}

    out: Dict[str, List[EvidenceSpan]] = {}

    for p in precedents:
        if not p.full_text:
            continue

        paras = split_paragraphs(p.full_text)
        # 너무 짧은 문단(제목/당사자 표기 등) 제거
        paras = [x for x in paras if len(x) >= min_paragraph_chars]
        if not paras:
            continue

        idx = build_bm25_index(paras)

        scored: List[Tuple[int, float]] = []
        for i in range(idx.N):
            s = idx.score(q_tokens, i)
            if s > 0:
                scored.append((i, s))

        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:top_n_per_case]

        out[p.precedent_id] = [
            EvidenceSpan(
                precedent_id=p.precedent_id,
                paragraph_index=i,
                score=s,
                text=idx.paragraphs[i],
            )
            for i, s in top
        ]

    return out
