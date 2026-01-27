# build_vector_db.py
from __future__ import annotations

import os
from typing import Any, Iterable, List, Optional

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from config import DataKind, RAG
from db_read import iter_documents
from chunking import chunk_documents


def get_chroma_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(
        path=str(RAG.chroma_dir),
        settings=Settings(anonymized_telemetry=False),
    )


def get_collection_name(kind: DataKind) -> str:
    return RAG.datasets[kind].collection_name


def get_chroma_collection(kind: DataKind):
    client = get_chroma_client()
    name = get_collection_name(kind)
    return client.get_or_create_collection(name=name)


def reset_collection(kind: DataKind) -> None:
    client = get_chroma_client()
    name = get_collection_name(kind)
    try:
        client.delete_collection(name=name)
        print(f"[INFO] deleted collection: {name}")
    except Exception:
        pass
    client.get_or_create_collection(name=name)
    print(f"[INFO] created collection: {name}")


def _batch(iterable: List[Any], batch_size: int) -> Iterable[List[Any]]:
    for i in range(0, len(iterable), batch_size):
        yield iterable[i : i + batch_size]


def _precedent_mode_hint(kind: DataKind) -> str:
    if kind != "precedent":
        return ""
    # config.py에서 선택된 dataset이 이미 반영되어 있음.
    # 여기서는 참고용으로 env를 찍어주기만 함.
    mode = os.environ.get("PRECEDENT_VECTOR_MODE", "headnote")
    return f" (precedent_mode={mode})"


def build_vector_db(
    kind: DataKind,
    *,
    limit: Optional[int] = None,
    reset: bool = False,
    batch_size: int = 128,
    **read_kwargs: Any,
) -> None:
    if reset:
        reset_collection(kind)

    # 1) load docs
    docs = list(iter_documents(kind, limit=limit, **read_kwargs))
    if not docs:
        print(f"[WARN] no documents loaded (kind={kind})")
        return

    # 2) chunking
    chunks = chunk_documents(docs, kind=kind)
    if not chunks:
        print(f"[WARN] no chunks generated (kind={kind})")
        return

    print(
        f"[INFO] kind={kind}{_precedent_mode_hint(kind)} "
        f"docs={len(docs)} chunks={len(chunks)} "
        f"collection={get_collection_name(kind)}"
    )

    # 3) embedding model
    model = SentenceTransformer(RAG.embedding_model_name)

    # 4) chroma collection
    col = get_chroma_collection(kind)

    for chunk_batch in _batch(chunks, batch_size):
        ids = [c.metadata["chunk_id"] for c in chunk_batch]
        documents = [c.page_content for c in chunk_batch]
        metadatas = [c.metadata for c in chunk_batch]

        embeddings = model.encode(
            documents,
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()

        col.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings,
        )

    print("[DONE] vector DB build completed")
    print(
        f"[INFO] kind={kind}{_precedent_mode_hint(kind)} "
        f"collection={get_collection_name(kind)} stored_at={RAG.chroma_dir}"
    )


if __name__ == "__main__":
    # 기본: headnote 모드로 precedent가 빌드됨 (env 미설정이면 headnote)
    build_vector_db("mediation", reset=True)
    build_vector_db("law", reset=True)
    build_vector_db("precedent", reset=True)

    # 전문 컬렉션을 따로 만들고 싶으면 아래처럼 실행:
    # Windows PowerShell:
    #   $env:PRECEDENT_VECTOR_MODE="fulltext"; python build_vector_db.py
    #
    # bash:
    #   PRECEDENT_VECTOR_MODE=fulltext python build_vector_db.py
