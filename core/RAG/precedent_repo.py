# precedent_repo.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from db_read import db_conn


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
    # pymysql이 date/datetime으로 주는 경우가 많아서 안전 변환
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
    """
    precedent_id -> PrecedentRecord dict로 반환.
    include_full_text=False로 하면 전문은 안 가져오게 할 수 있음(가벼운 조회).
    """
    ids = [str(x).strip() for x in precedent_ids if str(x).strip()]
    if not ids:
        return {}

    # IN 절 파라미터 구성
    placeholders = ",".join(["%s"] * len(ids))

    # full_text는 옵션으로
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

    sql = f"""
    SELECT
      {", ".join(select_cols)}
    FROM precedents
    WHERE precedent_id IN ({placeholders})
    """

    out: Dict[str, PrecedentRecord] = {}

    with db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, ids)
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
