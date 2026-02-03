from __future__ import annotations

from typing import Any, Dict, List, Optional

import pymysql
import json
from config import SECTION_FIELDS, load_db_config


def get_conn():

    cfg = load_db_config()
    return pymysql.connect(
        host=cfg.host,
        port=cfg.port,
        user=cfg.user,
        password=cfg.password,
        database=cfg.database,
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )


def fetch_cases(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    case_id : 청크의 기본 식별자(최소 메타)
    title: 검색 결과를 사람이 점검하기위한 최소 단서
    """

    section_cols = ",\n ".join(SECTION_FIELDS)

    sql = f"""
    SELECT
        case_id,
        title,
        {section_cols}
    FROM mediation_cases
    ORDER BY case_id ASC
    {f"LIMIT {int(limit)}" if limit is not None else ""}
    """

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        rows = cur.fetchall()
        return rows
    finally:
        conn.close()


if __name__ == "__main__":
    rows = fetch_cases(limit=1)
    # print(f"loaded: {len(rows)}")
    print(rows[0])
    print(json.dumps(rows[0], indent=2, ensure_ascii=False))
    # for r in rows:
    #     print("case_id:", r["case_id"], "|title:", (r.get("title") or ""))
    #     print(r)
    #     for f in SECTION_FIELDS:
    #         v = r.get(f)
    #     print(f"  - {f}: {'NULL' if v is None else len(str(v))} chars")
    #     print()
