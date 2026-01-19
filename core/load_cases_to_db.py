# load_cases_to_mariadb.py
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import pymysql
from dotenv import load_dotenv


# -----------------------------
# ENV & PATH
# -----------------------------
load_dotenv()

JSON_DIR = Path("json")  # ← 여기만 바꾸면 됨


# -----------------------------
# DB CONFIG
# -----------------------------
def get_db_conn():
    return pymysql.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ.get("DB_PORT", 3306)),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASS"],
        database=os.environ["DB_NAME"],
        charset="utf8mb4",
        autocommit=False,
    )


# -----------------------------
# JSON LOAD
# -----------------------------
def load_json_array(path: Path) -> List[Dict[str, Any]]:
    raw = path.read_text(encoding="utf-8").strip()
    data = json.loads(raw)

    if not isinstance(data, list):
        raise RuntimeError(f"{path.name} : JSON 배열이 아님")

    return data


# -----------------------------
# NORMALIZE
# -----------------------------
NULLABLE_FIELDS = {
    "issues",
    "related_rules",
    "related_precedents",
    "result",
    "order_text",
}


def normalize(row: Dict[str, Any]) -> Dict[str, Any]:
    # 숫자 필드
    row["source_year"] = int(row["source_year"])
    row["page_start"] = int(row["page_start"])
    row["page_end"] = int(row["page_end"])

    # NULL 처리
    for k in NULLABLE_FIELDS:
        if row.get(k, "") == "":
            row[k] = None

    return row


# -----------------------------
# INSERT
# -----------------------------
INSERT_SQL = """
INSERT IGNORE INTO mediation_cases
(
    source_year,
    source_name,
    source_doc,
    page_start,
    page_end,
    title,
    facts,
    issues,
    related_rules,
    related_precedents,
    result,
    order_text
)
VALUES
(
    %(source_year)s,
    %(source_name)s,
    %(source_doc)s,
    %(page_start)s,
    %(page_end)s,
    %(title)s,
    %(facts)s,
    %(issues)s,
    %(related_rules)s,
    %(related_precedents)s,
    %(result)s,
    %(order_text)s
)
"""


def insert_cases(conn, cases: List[Dict[str, Any]]):
    with conn.cursor() as cur:
        cur.executemany(INSERT_SQL, cases)
    conn.commit()
    return len(cases)


# -----------------------------
# MAIN
# -----------------------------
def main():
    files = sorted(JSON_DIR.glob("*.txt"))
    if not files:
        raise RuntimeError("json/ 디렉토리에 txt 파일이 없습니다")

    conn = get_db_conn()
    total = 0

    try:
        for file in files:
            print(f"[LOAD] {file.name}")

            data = load_json_array(file)
            normalized = [normalize(row) for row in data]

            inserted = insert_cases(conn, normalized)
            total += inserted

            print(f"[DONE] {file.name} rows={inserted}")

        print(f"\n=== TOTAL INSERTED: {total} ===")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
