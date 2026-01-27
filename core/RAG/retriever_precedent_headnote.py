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
    """
    precedent_id는 chunk metadata에 있어야 정상.
    없으면 parent_doc_id/doc_id에서 보조 추출 시도.
    """
    pid = meta.get("precedent_id")
    if pid:
        return str(pid)

    # fallback: "precedent:76504" 같은 형태에서 추출
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

    hits: List[SearchHit] = search_chroma(
        collection_name=col_name,
        query_text=clause_text,
        top_k=top_k,
        model=model,
    )

    out: List[PrecedentHeadnoteHit] = []
    for h in hits:
        meta = dict(h.doc.metadata or {})
        precedent_id = _extract_precedent_id(meta)
        if not precedent_id:
            # precedent_id가 없으면 2차에서 전문을 못 가져오므로 제외(또는 로깅)
            continue

        out.append(
            PrecedentHeadnoteHit(
                precedent_id=precedent_id,
                case_name=meta.get("case_name"),
                case_number=meta.get("case_number"),
                decision_date=meta.get("decision_date"),
                distance=h.distance,
                doc=h.doc,
                chroma_id=h.chroma_id,
            )
        )

    return out
