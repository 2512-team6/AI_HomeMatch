# evidence_extractor_bm25.py
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Dict, List, Tuple, Iterable, Set

from precedent_repo import PrecedentRecord


# -----------------------------
# Tokenize / split helpers
# -----------------------------
# ✅ 한자(\u4e00-\u9fff), 가운데점(·)까지 포함
_WORD_RE = re.compile(r"[0-9A-Za-z가-힣\u4e00-\u9fff·]+")

_HTML_BR_RE = re.compile(r"(?i)<br\s*/?>")
_HTML_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"[ \t]+")


# -----------------------------
# Stopwords (minimal, conservative)
# - 너무 공격적으로 넣으면 근거가 안 뽑히는 케이스가 생길 수 있어 "보수적으로" 시작
# - 필요하면 운영하면서 추가해도 됨
# -----------------------------
_STOPWORDS: Set[str] = {
    # 일반 기능어/접속/지시
    "및",
    "또는",
    "등",
    "의",
    "에",
    "를",
    "을",
    "은",
    "는",
    "이",
    "가",
    "과",
    "와",
    "으로",
    "로",
    "에서",
    "에게",
    "대하여",
    "대한",
    "관련",
    "관하여",
    "따라",
    "따른",
    "경우",
    "때",
    "사실",
    "이유",
    "내용",
    "사항",
    "규정",
    "조항",
    "법",
    "법령",
    # 임대차/계약 문서에서 과도하게 흔한 단어(너무 많이 넣지 말고 핵심만)
    "임대차",
    "계약",
    "임대인",
    "임차인",
    "보증금",
    "차임",
    "월세",
    "전세",
    "해지",
    "갱신",
    "반환",
    "지급",
    "부담",
    "의무",
}


def _strip_html(text: str) -> str:
    if not text:
        return ""
    t = _HTML_BR_RE.sub("\n", text)
    t = _HTML_TAG_RE.sub("", t)
    return t


def _normalize_text(text: str) -> str:
    if not text:
        return ""
    t = text.replace("\r\n", "\n").replace("\r", "\n")
    t = _WS_RE.sub(" ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def _filter_tokens(tokens: Iterable[str]) -> List[str]:
    out: List[str] = []
    for w in tokens:
        ww = (w or "").strip().lower()
        if not ww:
            continue
        # 너무 짧은 토큰 제거(예: 1글자)
        if len(ww) <= 1:
            continue
        # stopword 제거
        if ww in _STOPWORDS:
            continue
        out.append(ww)
    return out


def tokenize_ko(text: str) -> List[str]:
    """
    아주 단순 토크나이저.
    - 한국어/영문/숫자/한자/· 덩어리 기준
    - stopwords + 1글자 토큰 제거로 노이즈 감소
    """
    t = _normalize_text(_strip_html(text))
    toks = _WORD_RE.findall(t.lower())
    return _filter_tokens(toks)


def _merge_lines_to_paragraphs(
    lines: List[str],
    *,
    min_paragraph_chars: int,
    max_paragraph_chars: int = 1800,
) -> List[str]:
    """
    줄 단위로만 분리된 텍스트를 '적당한 문단'으로 합쳐서 BM25가 근거를 잡기 쉽게 만든다.
    - 너무 짧은 줄은 누적해서 합침
    - 너무 길어지면 강제로 끊어줌
    """
    paras: List[str] = []
    buf: List[str] = []
    buf_len = 0

    def flush():
        nonlocal buf, buf_len
        if not buf:
            return
        p = "\n".join(buf).strip()
        if p:
            paras.append(p)
        buf = []
        buf_len = 0

    for ln in lines:
        ln = ln.strip()
        if not ln:
            # 빈 줄 = 문단 경계
            flush()
            continue

        # 누적
        buf.append(ln)
        buf_len += len(ln) + 1

        # 너무 길어지면 끊기
        if buf_len >= max_paragraph_chars:
            flush()
            continue

        # 충분히 길어지면 문단 확정
        if buf_len >= min_paragraph_chars:
            flush()

    flush()
    return paras


def split_paragraphs(full_text: str, *, min_paragraph_chars: int = 40) -> List[str]:
    """
    판례 전문은 <br/> 같은 HTML이 섞여 있을 수 있음.
    1) HTML 제거 + 정규화
    2) 빈줄 기준 분리
    3) 문단 분리가 약하면(너무 적게 나오면) 줄 단위 fallback 후 적당히 합치기
    """
    if not full_text:
        return []

    t = _normalize_text(_strip_html(full_text))
    if not t:
        return []

    # 1차: 빈 줄 기준 문단 분리
    raw = re.split(r"\n\s*\n+", t)
    paras = [p.strip() for p in raw if p and p.strip()]

    # 문단이 너무 적으면(예: <br/>만 잔뜩 있고 빈 줄이 없는 전문) fallback
    if len(paras) <= 2:
        lines = t.split("\n")
        paras = _merge_lines_to_paragraphs(
            lines,
            min_paragraph_chars=max(min_paragraph_chars, 120),
            max_paragraph_chars=1800,
        )

    # 너무 짧은 문단 제거
    paras = [p for p in paras if len(p) >= min_paragraph_chars]
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
    min_overlap: int = 2,  # ✅ 겹치는 토큰이 최소 이 개수 이상일 때만 증거 후보로
) -> Dict[str, List[EvidenceSpan]]:
    q_tokens = tokenize_ko(clause_text)
    if not q_tokens:
        return {}

    # 쿼리가 너무 짧으면 overlap 기준을 완화(증거가 아예 0이 되는 걸 방지)
    # 예: stopwords 제거 후 토큰이 1~2개 남는 케이스
    if len(q_tokens) <= 2:
        eff_min_overlap = 1
    else:
        eff_min_overlap = min_overlap

    q_set = set(q_tokens)

    out: Dict[str, List[EvidenceSpan]] = {}

    for p in precedents:
        if not p.full_text:
            continue

        paras = split_paragraphs(p.full_text, min_paragraph_chars=min_paragraph_chars)
        if not paras:
            continue

        idx = build_bm25_index(paras)

        scored: List[Tuple[int, float]] = []
        for i in range(idx.N):
            doc_toks = idx.doc_tokens[i]
            if not doc_toks:
                continue

            # ✅ overlap(교집합) 최소 조건
            overlap = len(q_set.intersection(doc_toks))
            if overlap < eff_min_overlap:
                continue

            s = idx.score(q_tokens, i)
            if s > 0:
                scored.append((i, s))

        if not scored:
            continue  # ✅ 이 판례에서는 유효 근거 없음

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
