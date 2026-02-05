from __future__ import annotations

from typing import Any, Dict, Optional

# -------------------------------
# [유지] 인메모리 저장소
# -------------------------------
_store: Dict[int, Dict[str, Any]] = {}
_next_id = 1


def save_document(
    extracted_text: str,
    parsed_data: Dict[str, Any],
    sections: Dict[str, str],
    **extra: Any,
) -> int:
    """
    문서를 메모리에만 저장하고 ID를 반환
    (로컬 파일 저장 기능 제거)
    """
    global _next_id

    doc_id = _next_id
    _next_id += 1

    _store[doc_id] = {
        "id": doc_id,
        "extracted_text": extracted_text,
        "parsed_data": parsed_data,
        "sections": sections,
        **extra,
    }

    return doc_id


def get_document(doc_id: int) -> Optional[Dict[str, Any]]:
    """메모리에서 문서 조회"""
    return _store.get(doc_id)


def update_document(doc_id: int, **kwargs: Any) -> bool:
    """메모리의 문서만 수정"""
    if doc_id not in _store:
        return False

    for k, v in kwargs.items():
        _store[doc_id][k] = v

    return True
