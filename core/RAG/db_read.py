# db_read.py
from __future__ import annotations

from contextlib import contextmanager
from dataclasses import asdict
from datetime import date
from typing import Any, Dict, Generator, Iterable, List, Literal, Optional, Tuple

import pymysql
from pymysql.cursors import DictCursor

from langchain_core.documents import Document

from config import DataKind, RAG, load_db_config


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
        val_s = _clip(val_s, clips.get(field))
        # 필드 구분을 넣어두면 법률/판례 텍스트가 길어도 컨텍스트에서 가독성이 좋아짐
        parts.append(f"[{field}]\n{val_s}")

    return "\n\n".join(parts).strip()


def _common_meta(kind: DataKind, row: Dict[str, Any]) -> Dict[str, Any]:
    # 공통 메타: 어디서 왔는지, 문서 단위 식별, 페이지 등
    meta: Dict[str, Any] = {
        "data_kind": kind,
        "source_year": row.get("source_year"),
        "source_name": row.get("source_name"),
        "source_doc": row.get("source_doc"),
        "page_start": row.get("page_start"),
        "page_end": row.get("page_end"),
        "title": row.get("title"),
    }
    # None 제거
    return {k: v for k, v in meta.items() if v is not None}


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
                meta = _common_meta("mediation", row)
                meta.update(
                    {
                        "doc_id": f"mediation:{row['case_id']}",
                        "pk": row["case_id"],
                        "table": "mediation_cases",
                    }
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
                # config의 law text_fields가 ["title","text"]라면 그대로 잘 합쳐짐
                content = _build_page_content("law", row)
                meta = _common_meta("law", row)
                meta.update(
                    {
                        "doc_id": f"law:{row['id']}",
                        "pk": int(row["id"]),
                        "table": "law_text",
                    }
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

    # 1) "필요한 컬럼"만 SELECT 하도록 구성
    # - 텍스트 합치기에 필요한 컬럼: ds.text_fields
    # - 메타 생성에 필요한 컬럼: 아래 meta에서 참조하는 것들
    # - 필터에 필요한 컬럼: where절에서 사용하는 것들
    required_cols = set(ds.text_fields)

    # meta에 쓰는 컬럼들
    required_cols.update(
        [
            "precedent_id",
            "case_name",
            "case_number",
            "decision_date",
            "court_name",
            "judgment_type",
        ]
    )

    # where절에 쓰는 컬럼들(없으면 필터가 안되니 포함)
    if decision_date_from is not None or decision_date_to is not None:
        required_cols.add("decision_date")
    if court_name is not None:
        required_cols.add("court_name")
    if precedent_ids:
        required_cols.add("precedent_id")

    # 정렬에 쓰는 컬럼
    required_cols.add("decision_date")

    # SELECT 절 생성(항상 precedent_id는 있어야 doc_id 만들 수 있음)
    if "precedent_id" not in required_cols:
        required_cols.add("precedent_id")

    # 안전하게 정렬(가독성)
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

                meta: Dict[str, Any] = {
                    "data_kind": "precedent",
                    "doc_id": f"precedent:{row['precedent_id']}",
                    "pk": row["precedent_id"],
                    "table": "precedents",
                    "precedent_id": row["precedent_id"],
                    "case_name": row.get("case_name"),
                    "case_number": row.get("case_number"),
                    "decision_date": (
                        row.get("decision_date").isoformat()
                        if row.get("decision_date")
                        else None
                    ),
                    "court_name": row.get("court_name"),
                    "judgment_type": row.get("judgment_type"),
                }
                meta = {k: v for k, v in meta.items() if v is not None}
                yield Document(page_content=content, metadata=meta)


# -----------------------------
# Unified loader
# -----------------------------


def iter_documents(kind: DataKind, **kwargs: Any) -> Generator[Document, None, None]:
    """
    kind에 따라 해당 테이블에서 Document를 yield.
    kwargs는 각 iter_* 함수의 파라미터를 그대로 전달.
    """
    if kind == "mediation":
        yield from iter_mediation_documents(**kwargs)
    elif kind == "law":
        yield from iter_law_documents(**kwargs)
    elif kind == "precedent":
        yield from iter_precedent_documents(**kwargs)
    else:
        raise ValueError(f"Unknown DataKind: {kind}")
