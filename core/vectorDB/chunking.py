from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from config import RAG, SECTION_FIELDS
from db_read import fetch_cases


@dataclass(frozen=True)
class Chunk:
    chunk_id: str
    text: str
    metadata: Dict[str, Any]


def split_text(text: str, chunk_size: int, overlap: int) -> List[str]:
    """
    긴 텍스트를 '글자 수' 기준으로 나눈다.
    - 법률 텍스트는 길고 문단/번호가 많아서 실습 단계에선 글자 기반이 단순하고 안정적임.
    - overlap을 두면 청크 경계에서 문맥이 끊기는 문제를 완화할 수 있음.
    """

    text = (text or "").strip()
    if not text:
        return []

    out: List[str] = []
    start = 0
    n = len(text)

    while start < n:
        end = min(start + chunk_size, n)
        out.append(text[start:end])

        if end == n:
            break

        start = max(0, end - overlap)

    return out


def case_to_chunks(case_row: Dict[str, Any]) -> List[Chunk]:

    # DB에서 읽어온 케이스 1건을 청크 여러 개로 변환한다.
    case_id = case_row["case_id"]
    title = case_row.get("title") or ""

    chunks: List[Chunk] = []

    for section in SECTION_FIELDS:
        raw = case_row.get(section)

        if raw is None:
            continue
        text = str(raw).strip()
        if not text:
            continue

        parts = split_text(text, RAG.chunk_size, RAG.chunk_overlap)
        for i, part in enumerate(parts):

            chunk_id = f"{case_id}:{section}:{i}"

            metadata = {
                "case_id": case_id,
                "title": title,
                "section": section,
                "part_index": i,
                "part_count": len(parts),
            }

        chunks.append(Chunk(chunk_id=chunk_id, text=part, metadata=metadata))

    return chunks


def make_chunks(case_rows: List[Dict[str, Any]]) -> List[Chunk]:
    """
    여러 케이스를 받아 전체 청크 리스트로 만든다.
    """
    all_chunks: List[Chunk] = []
    for row in case_rows:
        all_chunks.extend(case_to_chunks(row))

    return all_chunks


if __name__ == "__main__":

    rows = fetch_cases(limit=1)
    a = rows[0]

    chunks = case_to_chunks(a)
    print("chunks", len(chunks))

    for c in chunks[:5]:
        print(c.chunk_id, c.metadata, len(c.text))
