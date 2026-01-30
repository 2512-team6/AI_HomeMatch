from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional

_store: Dict[int, Dict[str, Any]] = {}
_next_id = 1

# core/register_data/ 아래에 JSON 저장(레포 루트 기준 경로를 고정)
DATA_DIR = Path(__file__).resolve().parents[1] / "register_data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _persist_to_file(doc: Dict[str, Any]) -> None:
    doc_id = doc.get("id")
    if not doc_id:
        return
    path = DATA_DIR / f"document_{doc_id}.json"
    try:
        with path.open("w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=2)
    except Exception:
        # 저장 실패해도 API 전체는 살린다.
        pass


def save_document(
    extracted_text: str,
    parsed_data: Dict[str, Any],
    sections: Dict[str, str],
    **extra: Any,
) -> int:
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
    _persist_to_file(_store[doc_id])
    return doc_id


def get_document(doc_id: int) -> Optional[Dict[str, Any]]:
    return _store.get(doc_id)


def update_document(doc_id: int, **kwargs: Any) -> bool:
    if doc_id not in _store:
        return False
    for k, v in kwargs.items():
        _store[doc_id][k] = v
    _persist_to_file(_store[doc_id])
    return True

