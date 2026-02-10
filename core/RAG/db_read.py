# db_read.py
from __future__ import annotations

import re
from contextlib import contextmanager
from datetime import date
from typing import Any, Dict, Generator, List, Optional

import pymysql
from pymysql.cursors import DictCursor

from langchain_core.documents import Document

from .config import DataKind, RAG, load_db_config


# -----------------------------
# DB connection helpers
# -----------------------------
@contextmanager
def db_conn():
    cfg = load_db_config()
    conn = pymysql.connect(
        host=cfg.host,
        port=cfg.port,
        user=cfg.user,
        password=cfg.password,
        database=cfg.database,
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=True,
    )
    try:
        yield conn
    finally:
        conn.close()


# -----------------------------
# Text normalization helpers
# -----------------------------
_HTML_BR_RE = re.compile(r"(?i)<br\s*/?>")
_HTML_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"[ \t]+")


def _strip_html(s: str) -> str:
    """
    판례 headnote 계열(issues/summary/referenced_*)에 흔한 <br/> 등 HTML 노이즈 제거.
    - <br>는 줄바꿈으로 치환
    - 나머지 태그는 제거
    """
    s = _HTML_BR_RE.sub("\n", s)
    s = _HTML_TAG_RE.sub("", s)
    return s


def _normalize_text(s: str) -> str:
    """
    임베딩 입력의 불필요한 노이즈만 정리(구조는 유지).
    - CRLF 통일
    - 탭/연속 공백 축소
    - 과도한 연속 개행(3개 이상) 축소
    """
    s = s.replace("\r\n", "\n").replace("\r", "\n")
    s = _WS_RE.sub(" ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def _clip(text: Optional[str], max_chars: Optional[int]) -> str:
    if not text:
        return ""
    if max_chars is None:
        return text
    return text[:max_chars]


def _build_page_content(kind: DataKind, row: Dict[str, Any]) -> str:
    ds = RAG.datasets[kind]
    clips = ds.field_max_chars or {}

    parts: List[str] = []
    for field in ds.text_fields:
        val = row.get(field)
        if val is None:
            continue

        val_s = str(val).strip()
        if not val_s:
            continue

        # ✅ 판례 headnote 필드에 섞인 HTML 제거(전 데이터셋에 적용해도 안전)
        if "<" in val_s and ">" in val_s:
            val_s = _strip_html(val_s)

        # clip → normalize 순서(clip 후 정규화로 길이 폭주 방지)
        val_s = _clip(val_s, clips.get(field))
        val_s = _normalize_text(val_s)

        if not val_s:
            continue

        # 필드 구분 라벨은 유지(컨텍스트 가독성 + 임베딩에도 "어떤 정보인지" 힌트)
        parts.append(f"[{field}]\n{val_s}")

    return "\n\n".join(parts).strip()


def _build_meta(
    kind: DataKind,
    row: Dict[str, Any],
    doc_id: str,
    table: str,
) -> Dict[str, Any]:
    """
    config.RAG.datasets[kind].metadata_fields를 기준으로 메타 구성 (단일 출처).
    doc_id, table은 Chroma/청크 추적용으로 항상 포함.
    """
    meta: Dict[str, Any] = {
        "data_kind": kind,
        "doc_id": doc_id,
        "table": table,
    }
    for field in RAG.datasets[kind].metadata_fields:
        if field not in row:
            continue
        val = row[field]
        if val is None:
            continue
        if hasattr(val, "isoformat") and callable(getattr(val, "isoformat")):
            val = val.isoformat()
        meta[field] = val
    return meta


# -----------------------------
# Mediation cases
# Table: mediation_cases
# -----------------------------
def iter_mediation_documents(
    *,
    source_year: Optional[int] = None,
    case_id_min: Optional[int] = None,
    case_id_max: Optional[int] = None,
    limit: Optional[int] = None,
) -> Generator[Document, None, None]:
    sql = """
    SELECT
      case_id,
      source_year, source_name, source_doc,
      page_start, page_end,
      title,
      facts, issues, related_rules, related_precedents, result, order_text,
      created_at, updated_at
    FROM mediation_cases
    WHERE 1=1
    """
    params: List[Any] = []

    if source_year is not None:
        sql += " AND source_year = %s"
        params.append(source_year)
    if case_id_min is not None:
        sql += " AND case_id >= %s"
        params.append(case_id_min)
    if case_id_max is not None:
        sql += " AND case_id <= %s"
        params.append(case_id_max)

    sql += " ORDER BY case_id ASC"

    if limit is not None:
        sql += " LIMIT %s"
        params.append(limit)

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            for row in cur.fetchall():
                content = _build_page_content("mediation", row)
                meta = _build_meta(
                    "mediation",
                    row,
                    doc_id=f"mediation:{row['case_id']}",
                    table="mediation_cases",
                )
                yield Document(page_content=content, metadata=meta)


# -----------------------------
# Law text
# Table: law_text
# -----------------------------
def iter_law_documents(
    *,
    source_year: Optional[int] = None,
    source_name: Optional[str] = None,
    id_min: Optional[int] = None,
    id_max: Optional[int] = None,
    limit: Optional[int] = None,
) -> Generator[Document, None, None]:
    sql = """
    SELECT
      id,
      source_year, source_name, source_doc,
      page_start, page_end,
      title,
      text,
      created_at, updated_at
    FROM law_text
    WHERE 1=1
    """
    params: List[Any] = []

    if source_year is not None:
        sql += " AND source_year = %s"
        params.append(source_year)
    if source_name is not None:
        sql += " AND source_name = %s"
        params.append(source_name)
    if id_min is not None:
        sql += " AND id >= %s"
        params.append(id_min)
    if id_max is not None:
        sql += " AND id <= %s"
        params.append(id_max)

    sql += " ORDER BY id ASC"

    if limit is not None:
        sql += " LIMIT %s"
        params.append(limit)

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            for row in cur.fetchall():
                content = _build_page_content("law", row)
                meta = _build_meta(
                    "law",
                    row,
                    doc_id=f"law:{row['id']}",
                    table="law_text",
                )
                yield Document(page_content=content, metadata=meta)


# -----------------------------
# Precedents
# Table: precedents
# -----------------------------
def iter_precedent_documents(
    *,
    decision_date_from: Optional[date] = None,
    decision_date_to: Optional[date] = None,
    court_name: Optional[str] = None,
    precedent_ids: Optional[List[str]] = None,
    limit: Optional[int] = None,
) -> Generator[Document, None, None]:
    ds = RAG.datasets["precedent"]

    required_cols = set(ds.text_fields)
    required_cols.update(
        [
            "precedent_id",
            "case_name",
            "case_number",
            "decision_date",
            "court_name",
            "judgment_type",
            "decision_type",
            "case_type_name",
        ]
    )

    if decision_date_from is not None or decision_date_to is not None:
        required_cols.add("decision_date")
    if court_name is not None:
        required_cols.add("court_name")
    if precedent_ids:
        required_cols.add("precedent_id")

    required_cols.add("decision_date")
    if "precedent_id" not in required_cols:
        required_cols.add("precedent_id")

    select_cols = sorted(required_cols)

    sql = f"""
    SELECT
      {", ".join(select_cols)}
    FROM precedents
    WHERE 1=1
    """
    params: List[Any] = []

    if decision_date_from is not None:
        sql += " AND decision_date >= %s"
        params.append(decision_date_from)
    if decision_date_to is not None:
        sql += " AND decision_date <= %s"
        params.append(decision_date_to)
    if court_name is not None:
        sql += " AND court_name = %s"
        params.append(court_name)
    if precedent_ids:
        placeholders = ",".join(["%s"] * len(precedent_ids))
        sql += f" AND precedent_id IN ({placeholders})"
        params.extend(precedent_ids)

    sql += " ORDER BY decision_date DESC"

    if limit is not None:
        sql += " LIMIT %s"
        params.append(limit)

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            for row in cur.fetchall():
                content = _build_page_content("precedent", row)
                meta = _build_meta(
                    "precedent",
                    row,
                    doc_id=f"precedent:{row['precedent_id']}",
                    table="precedents",
                )
                yield Document(page_content=content, metadata=meta)


# -----------------------------
# Unified loader
# -----------------------------
def iter_documents(kind: DataKind, **kwargs: Any) -> Generator[Document, None, None]:
    if kind == "mediation":
        yield from iter_mediation_documents(**kwargs)
    elif kind == "law":
        yield from iter_law_documents(**kwargs)
    elif kind == "precedent":
        yield from iter_precedent_documents(**kwargs)
    else:
        raise ValueError(f"Unknown DataKind: {kind}")
