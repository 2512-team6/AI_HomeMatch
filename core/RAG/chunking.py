# chunking.py
from __future__ import annotations

from typing import Iterable, List, Optional

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import RAG, DataKind
from db_read import iter_documents


def get_text_splitter(
    *,
    chunk_size: int,
    chunk_overlap: int,
) -> RecursiveCharacterTextSplitter:
    """
    법률/판례/분쟁사례 모두에 공통으로 무난한 splitter.
    구분자 우선순위로 의미 단위를 최대한 보존하며 분할.
    """
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=[
            "\n\n",  # 문단
            "\n",  # 줄
            "。",  # 일본어 마침표(혹시 섞일 때)
            ".",  # 마침표
            "?",
            "!",  # 문장 끝
            " ",  # 단어 경계
            "",  # 최후의 수단(문자 단위)
        ],
    )


def chunk_documents(
    docs: Iterable[Document],
    *,
    kind: Optional[DataKind] = None,
) -> List[Document]:
    splitter = get_text_splitter(
        chunk_size=RAG.chunk_size,
        chunk_overlap=RAG.chunk_overlap,
    )

    # kind가 주어지면 해당 컬렉션명을 chunk_id에 포함 (headnote/fulltext 구분 안전)
    collection_name = None
    if kind is not None:
        collection_name = RAG.datasets[kind].collection_name

    out: List[Document] = []
    for doc in docs:
        parent_meta = dict(doc.metadata or {})
        parent_doc_id = (
            parent_meta.get("doc_id")
            or parent_meta.get("id")
            or parent_meta.get("pk")
            or "unknown"
        )

        if kind is not None and "data_kind" not in parent_meta:
            parent_meta["data_kind"] = kind

        pieces = splitter.split_text(doc.page_content or "")
        if not pieces:
            continue

        total = len(pieces)
        for i, text in enumerate(pieces):
            meta = dict(parent_meta)
            meta.update(
                {
                    "parent_doc_id": parent_doc_id,
                    "chunk_index": i,
                    "chunk_count": total,
                }
            )

            # ✅ chunk_id 안정화(컬렉션까지 포함)
            if collection_name:
                meta["collection_name"] = collection_name
                meta["chunk_id"] = f"{collection_name}::{parent_doc_id}::chunk::{i}"
            else:
                meta["chunk_id"] = f"{parent_doc_id}::chunk::{i}"

            out.append(Document(page_content=text, metadata=meta))

    return out


# -----------------------------
# Debug / local check
# -----------------------------
if __name__ == "__main__":
    # 예시: mediation 1건 읽어서 청킹 테스트
    # (db_read.py의 iter_documents를 사용)
    docs = list(iter_documents("mediation", limit=1))
    chunks = chunk_documents(docs, kind="mediation")

    print("docs:", len(docs))
    print("chunks:", len(chunks))
    for c in chunks[:5]:
        print(c.metadata.get("chunk_id"), c.metadata.get("title"), len(c.page_content))
