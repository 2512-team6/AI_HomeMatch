# retriever_chroma.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from langchain_core.documents import Document

from .config import RAG


@dataclass(frozen=True)
class SearchHit:
    doc: Document
    distance: float
    chroma_id: str


def get_chroma_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(
        path=str(RAG.chroma_dir),
        settings=Settings(anonymized_telemetry=False),
    )


def get_collection(name: str):
    client = get_chroma_client()
    return client.get_or_create_collection(name=name)


def embed_query(model: SentenceTransformer, text: str) -> List[float]:
    vec = model.encode([text], normalize_embeddings=True, show_progress_bar=False)[0]
    return vec.tolist()


def search_chroma(
    *,
    collection_name: str,
    query_text: str,
    top_k: int = 5,
    model: Optional[SentenceTransformer] = None,
) -> List[SearchHit]:
    """
    Chroma에서 top_k 검색 후 SearchHit 리스트 반환.

    - distance는 Chroma 설정에 따라 의미가 다를 수 있으나,
      일반적으로 "작을수록 유사"인 경우가 많음.
    """
    if not query_text.strip():
        return []

    col = get_collection(collection_name)

    _model = model or SentenceTransformer(RAG.embedding_model_name)
    q_emb = embed_query(_model, query_text)

    res = col.query(
        query_embeddings=[q_emb],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    ids = res.get("ids", [[]])[0]
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    dists = res.get("distances", [[]])[0]

    hits: List[SearchHit] = []
    for i in range(len(ids)):
        meta: Dict[str, Any] = metas[i] or {}
        doc = Document(page_content=docs[i] or "", metadata=meta)
        hits.append(SearchHit(doc=doc, distance=float(dists[i]), chroma_id=str(ids[i])))

    return hits
