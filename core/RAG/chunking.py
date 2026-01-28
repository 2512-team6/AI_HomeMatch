# chunking.py
from __future__ import annotations

import re
from typing import Iterable, List, Optional, Tuple

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import RAG, DataKind
from db_read import iter_documents


def _normalize_text(s: str) -> str:
    # db_read에서 이미 정규화하지만, 청킹 과정에서도 overlap 때문에 자투리 노이즈가 생길 수 있어 2차로 가볍게 정리
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def _chunk_params(kind: Optional[DataKind]) -> Tuple[int, int]:
    """
    kind별로 기본값을 조금 다르게 주고 싶을 때 여기서 조정.
    - config.py에서 공통 chunk_size/overlap을 조정해둔 상태라,
      여기서는 kind별 미세조정만 수행(원하면 숫자만 바꾸면 됨).
    """
    base_size = RAG.chunk_size
    base_overlap = RAG.chunk_overlap

    if kind == "law":
        # 법령은 조문 단위라 너무 길게 잡을 필요가 적고 overlap도 과하면 중복이 커짐
        return (min(base_size, 1000), min(base_overlap, 120))
    if kind == "precedent":
        # headnote 기준: 1000~1400 사이가 무난
        return (max(base_size, 1100), max(base_overlap, 140))
    if kind == "mediation":
        # facts/order_text가 길어 문단 보존이 중요. 약간 더 길게
        return (max(base_size, 1300), max(base_overlap, 180))

    return (base_size, base_overlap)


def get_text_splitter(
    *,
    chunk_size: int,
    chunk_overlap: int,
) -> RecursiveCharacterTextSplitter:
    """
    법률/판례/분쟁사례 공통 splitter.
    한국 법령 문서 기준으로 구분자 우선순위를 조정.
    """
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=[
            "\n\n",  # 문단
            "\n",  # 줄
            # 법령/판례에서 자주 등장하는 구조 단서(문장/항/호 경계)
            "다.",
            "라.",
            "마.",
            "바.",
            "사.",
            "아.",
            "자.",
            "차.",  # (선택) 목차형 경계
            "1.",
            "2.",
            "3.",
            "4.",
            "5.",
            "6.",
            "7.",
            "8.",
            "9.",
            "0.",  # 번호
            "제",  # "제1조", "제2항" 같은 경계 단서(과하면 삭제 가능)
            "항",
            "호",
            ".",
            "?",
            "!",
            " ",
            "",
        ],
    )


def chunk_documents(
    docs: Iterable[Document],
    *,
    kind: Optional[DataKind] = None,
    min_chunk_chars: int = 80,  # ✅ 너무 짧은 조각 제거(검색 노이즈↓)
) -> List[Document]:
    chunk_size, chunk_overlap = _chunk_params(kind)
    splitter = get_text_splitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

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

        base_text = _normalize_text(doc.page_content or "")
        if not base_text:
            continue

        pieces = splitter.split_text(base_text)
        if not pieces:
            continue

        total = len(pieces)
        for i, text in enumerate(pieces):
            text = _normalize_text(text)
            if len(text) < min_chunk_chars:
                continue

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
    docs = list(iter_documents("mediation", limit=1))
    chunks = chunk_documents(docs, kind="mediation")

    print("docs:", len(docs))
    print("chunks:", len(chunks))
    for c in chunks[:5]:
        print(c.metadata.get("chunk_id"), c.metadata.get("title"), len(c.page_content))
