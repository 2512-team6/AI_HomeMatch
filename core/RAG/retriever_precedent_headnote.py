# retriever_precedent_headnote.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from langchain_core.documents import Document
from sentence_transformers import SentenceTransformer

from config import RAG
from retriever_chroma import SearchHit, search_chroma


@dataclass(frozen=True)
class PrecedentHeadnoteHit:
    precedent_id: str
    case_name: Optional[str]
    case_number: Optional[str]
    decision_date: Optional[str]
    distance: float
    doc: Document
    chroma_id: str


def _extract_precedent_id(meta: Dict[str, Any]) -> Optional[str]:
    pid = meta.get("precedent_id")
    if pid:
        return str(pid)

    for key in ("doc_id", "parent_doc_id"):
        v = meta.get(key)
        if isinstance(v, str) and v.startswith("precedent:"):
            return v.split("precedent:", 1)[1].strip()

    return None


def retrieve_precedent_headnote(
    clause_text: str,
    *,
    top_k: int = 8,
    model: Optional[SentenceTransformer] = None,
) -> List[PrecedentHeadnoteHit]:
    col_name = RAG.datasets["precedent"].collection_name

    # ✅ 청크 검색은 중복이 많으니 "좀 더 넉넉히" 가져온 뒤 precedent_id 기준 dedupe
    raw_top_k = max(top_k * 3, top_k)

    hits: List[SearchHit] = search_chroma(
        collection_name=col_name,
        query_text=clause_text,
        top_k=raw_top_k,
        model=model,
    )

    # precedent_id별로 가장 좋은(distance 가장 낮은) hit만 유지
    best_by_pid: Dict[str, PrecedentHeadnoteHit] = {}

    for h in hits:
        meta = dict(h.doc.metadata or {})
        precedent_id = _extract_precedent_id(meta)
        if not precedent_id:
            continue

        cand = PrecedentHeadnoteHit(
            precedent_id=precedent_id,
            case_name=meta.get("case_name"),
            case_number=meta.get("case_number"),
            decision_date=meta.get("decision_date"),
            distance=h.distance,
            doc=h.doc,
            chroma_id=h.chroma_id,
        )

        prev = best_by_pid.get(precedent_id)
        if prev is None or cand.distance < prev.distance:
            best_by_pid[precedent_id] = cand

    # 거리 순으로 정렬 후 상위 top_k 판례만 반환
    out = sorted(best_by_pid.values(), key=lambda x: x.distance)
    return out[:top_k]
