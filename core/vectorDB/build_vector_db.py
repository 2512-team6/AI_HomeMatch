from __future__ import annotations

from typing import List

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from config import RAG
from db_read import fetch_cases
from chunking import Chunk, make_chunks


def get_chroma_collection():
    client = chromadb.PersistentClient(
        path=str(RAG.chroma_dir), settings=Settings(anonymized_telemetry=False)
    )
    return client.get_or_create_collection(name=RAG.collection_name)


def build_vector_db(limit: int | None = None):
    """
    전체 흐름:
    1) DB에서 케이스 로드
    2) 케이스 → 청크 변환
    3) 청크 텍스트 → 임베딩 벡터
    4) 벡터DB에 upsert
    """
    rows = fetch_cases(limit=limit)

    chunks: List[Chunk] = make_chunks(rows)

    print(f"[INFO] cases={len(rows)} chunks={len(chunks)}")
    if not chunks:
        print("[WARN] 생성된 청크가 없습니다.")
        return

    model = SentenceTransformer(RAG.embedding_model_name)

    col = get_chroma_collection()

    ids = [c.chunk_id for c in chunks]
    documents = [c.text for c in chunks]
    metadatas = [c.metadata for c in chunks]

    embeddings = model.encode(
        documents,
        normalize_embeddings=True,
        show_progress_bar=True,
    )

    col.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)

    print("[DONE] vector DB build completed")
    print(f"[INFO] stored at: {RAG.chroma_dir}")


if __name__ == "__main__":
    # limit=None → 전체 케이스
    build_vector_db(limit=None)
