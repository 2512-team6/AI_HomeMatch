# build_vector_db.py
from __future__ import annotations

import os
from typing import Any, Iterable, List, Optional

from sentence_transformers import SentenceTransformer

from .config import DataKind, RAG
from .db_read import iter_documents
from .chunking import chunk_documents
from .retriever_chroma import get_chroma_client


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
    mode = os.environ.get("PRECEDENT_VECTOR_MODE", "headnote")
    return f" (precedent_mode={mode})"


def build_vector_db(
    kind: DataKind,
    *,
    limit: Optional[int] = None,
    reset: bool = False,
    upsert_batch_size: int = 128,
    encode_batch_size: int = 64,
    doc_stream_batch: int = 200,  # ✅ DB에서 문서 N개씩 읽어 chunk->embed->upsert (메모리 안정)
    **read_kwargs: Any,
) -> None:
    """
    개선점(새 파일 추가 없이):
    - docs=list(...) / chunks=list(...) 전체 적재 제거 → 스트리밍 방식
    - encode batch_size 명시 → 환경마다 속도/메모리 안정
    - 최소 길이 chunk 필터는 chunking.py에서 처리(현재 min_chunk_chars=80)
    """

    if reset:
        reset_collection(kind)

    # 1) embedding model
    model = SentenceTransformer(RAG.embedding_model_name)

    # 2) chroma collection
    col = get_chroma_collection(kind)

    docs_iter = iter_documents(kind, limit=limit, **read_kwargs)

    docs_loaded = 0
    chunks_generated = 0
    chunks_upserted = 0

    # 스트리밍 버퍼(문서 단위)
    doc_buf: List[Any] = []

    # 스트리밍 버퍼(청크 단위)
    chunk_buf: List[Any] = []

    def flush_chunks() -> None:
        nonlocal chunks_upserted, chunk_buf
        if not chunk_buf:
            return

        ids = [c.metadata["chunk_id"] for c in chunk_buf]
        documents = [c.page_content for c in chunk_buf]
        metadatas = [c.metadata for c in chunk_buf]

        embeddings = model.encode(
            documents,
            normalize_embeddings=True,
            batch_size=encode_batch_size,
            show_progress_bar=False,
        ).tolist()

        col.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
            embeddings=embeddings,
        )
        chunks_upserted += len(chunk_buf)
        chunk_buf = []

    def process_doc_buf() -> None:
        nonlocal chunks_generated, chunk_buf
        if not doc_buf:
            return

        chunks = chunk_documents(
            doc_buf, kind=kind
        )  # chunking.py에서 kind별 파라미터/정규화 적용됨
        chunks_generated += len(chunks)

        # 청크를 upsert_batch_size 단위로 쌓아 encode+upsert
        for c in chunks:
            chunk_buf.append(c)
            if len(chunk_buf) >= upsert_batch_size:
                flush_chunks()

        doc_buf.clear()

    # 진행 로그(큰 데이터에서 “멈춘 것처럼 보임” 방지)
    print(
        f"[INFO] start build kind={kind}{_precedent_mode_hint(kind)} "
        f"collection={get_collection_name(kind)} store={RAG.chroma_dir}"
    )

    for doc in docs_iter:
        docs_loaded += 1
        doc_buf.append(doc)

        if len(doc_buf) >= doc_stream_batch:
            process_doc_buf()
            # 중간 로그
            print(
                f"[INFO] kind={kind}{_precedent_mode_hint(kind)} "
                f"docs_loaded={docs_loaded} chunks_generated={chunks_generated} chunks_upserted={chunks_upserted}"
            )

    # 마지막 남은 버퍼 처리
    process_doc_buf()
    flush_chunks()

    if docs_loaded == 0:
        print(f"[WARN] no documents loaded (kind={kind})")
        return

    print("[DONE] vector DB build completed")
    print(
        f"[INFO] kind={kind}{_precedent_mode_hint(kind)} "
        f"docs_loaded={docs_loaded} chunks_generated={chunks_generated} chunks_upserted={chunks_upserted} "
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
