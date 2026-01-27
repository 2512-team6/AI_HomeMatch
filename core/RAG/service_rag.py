# service_rag.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from sentence_transformers import SentenceTransformer

from config import RAG
from retriever_chroma import search_chroma, SearchHit
from retriever_precedent_headnote import (
    retrieve_precedent_headnote,
    PrecedentHeadnoteHit,
)
from precedent_repo import fetch_precedents_by_ids, PrecedentRecord
from evidence_extractor_bm25 import extract_evidence_bm25, EvidenceSpan
from evidence_filters import rerank_and_filter_evidence, ScoredEvidence


@dataclass(frozen=True)
class LayeredRAGResult:
    clause_text: str

    # law / mediation: 공통 SearchHit (Document + distance)
    law_hits: List[SearchHit]
    mediation_hits: List[SearchHit]

    # precedent
    precedent_headnote_hits: List[PrecedentHeadnoteHit]
    precedent_fulltext: Dict[str, PrecedentRecord]

    # evidence: precedent_id -> reranked spans
    precedent_evidence: Dict[str, List[ScoredEvidence]]


def run_layered_rag(
    clause_text: str,
    *,
    top_k_law: int = 4,
    top_k_precedent: int = 8,
    top_k_mediation: int = 4,
    top_n_evidence_raw: int = 8,
    top_n_evidence_final: int = 3,
    model: Optional[SentenceTransformer] = None,
) -> LayeredRAGResult:
    """
    LLM 호출 없이, "근거 패키지"를 만드는 단계.
    """
    if not clause_text.strip():
        raise ValueError("clause_text is empty")

    _model = model or SentenceTransformer(RAG.embedding_model_name)

    # 1) LAW layer
    law_col = RAG.datasets["law"].collection_name
    law_hits = search_chroma(
        collection_name=law_col,
        query_text=clause_text,
        top_k=top_k_law,
        model=_model,
    )

    # 2) PRECEDENT headnote layer
    prec_hits = retrieve_precedent_headnote(
        clause_text,
        top_k=top_k_precedent,
        model=_model,
    )
    precedent_ids = [h.precedent_id for h in prec_hits]

    # 3) PRECEDENT fulltext load (batch)
    prec_map = fetch_precedents_by_ids(precedent_ids, include_full_text=True)

    # 4) evidence extract (BM25) + filter/rerank
    records: List[PrecedentRecord] = []
    for pid in precedent_ids:
        rec = prec_map.get(pid)
        if rec and rec.full_text:
            records.append(rec)

    ev_map_raw: Dict[str, List[EvidenceSpan]] = extract_evidence_bm25(
        clause_text=clause_text,
        precedents=records,
        top_n_per_case=top_n_evidence_raw,
        min_paragraph_chars=40,
    )

    ev_map_final: Dict[str, List[ScoredEvidence]] = {}
    for pid, spans in ev_map_raw.items():
        ranked = rerank_and_filter_evidence(
            spans,
            drop_formal=True,
            min_adjusted_score=0.0,
        )
        ev_map_final[pid] = ranked[:top_n_evidence_final]

    # 5) MEDIATION layer
    med_col = RAG.datasets["mediation"].collection_name
    mediation_hits = search_chroma(
        collection_name=med_col,
        query_text=clause_text,
        top_k=top_k_mediation,
        model=_model,
    )

    return LayeredRAGResult(
        clause_text=clause_text,
        law_hits=law_hits,
        mediation_hits=mediation_hits,
        precedent_headnote_hits=prec_hits,
        precedent_fulltext=prec_map,
        precedent_evidence=ev_map_final,
    )
