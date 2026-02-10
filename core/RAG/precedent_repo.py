# precedent_repo.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .db_read import db_conn


@dataclass(frozen=True)
class PrecedentRecord:
    precedent_id: str
    case_name: Optional[str]
    case_number: Optional[str]
    decision_date: Optional[str]  # isoformat string
    court_name: Optional[str]
    judgment_type: Optional[str]
    issues: Optional[str]
    summary: Optional[str]
    referenced_laws: Optional[str]
    referenced_cases: Optional[str]
    full_text: Optional[str]


def _to_iso(d: Any) -> Optional[str]:
    if d is None:
        return None
    try:
        return d.isoformat()
    except Exception:
        return str(d)


def fetch_precedents_by_ids(
    precedent_ids: List[str],
    *,
    include_full_text: bool = True,
) -> Dict[str, PrecedentRecord]:
    # ✅ 공백 제거 + 중복 제거(순서 유지)
    seen = set()
    ids: List[str] = []
    for x in precedent_ids:
        s = str(x).strip()
        if not s:
            continue
        if s in seen:
            continue
        seen.add(s)
        ids.append(s)

    if not ids:
        return {}

    placeholders = ",".join(["%s"] * len(ids))

    select_cols = [
        "precedent_id",
        "case_name",
        "case_number",
        "decision_date",
        "court_name",
        "judgment_type",
        "issues",
        "summary",
        "referenced_laws",
        "referenced_cases",
    ]
    if include_full_text:
        select_cols.append("full_text")

    # ✅ 입력 ids 순서를 유지하면 튜닝/디버깅이 쉬움 (MariaDB/MySQL)
    sql = f"""
    SELECT
      {", ".join(select_cols)}
    FROM precedents
    WHERE precedent_id IN ({placeholders})
    ORDER BY FIELD(precedent_id, {placeholders})
    """

    out: Dict[str, PrecedentRecord] = {}

    with db_conn() as conn:
        with conn.cursor() as cur:
            # ORDER BY FIELD에 ids가 한 번 더 들어가므로 params도 2번
            cur.execute(sql, ids + ids)
            rows = cur.fetchall()

    for row in rows:
        pid = str(row["precedent_id"])
        out[pid] = PrecedentRecord(
            precedent_id=pid,
            case_name=row.get("case_name"),
            case_number=row.get("case_number"),
            decision_date=_to_iso(row.get("decision_date")),
            court_name=row.get("court_name"),
            judgment_type=row.get("judgment_type"),
            issues=row.get("issues"),
            summary=row.get("summary"),
            referenced_laws=row.get("referenced_laws"),
            referenced_cases=row.get("referenced_cases"),
            full_text=row.get("full_text") if include_full_text else None,
        )

    return out
