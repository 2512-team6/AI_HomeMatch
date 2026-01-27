# test_precedent_repo.py
from precedent_repo import fetch_precedents_by_ids


def main():
    # smoke_query 결과에서 하나 복사해서 넣기
    test_ids = ["76504"]  # ← 너 출력에서 나온 precedent_id

    data = fetch_precedents_by_ids(test_ids, include_full_text=True)

    print("returned keys:", list(data.keys()))

    rec = data.get("76504")
    if not rec:
        print("❌ record not found")
        return

    print("\n[ BASIC INFO ]")
    print("precedent_id:", rec.precedent_id)
    print("case_name:", rec.case_name)
    print("case_number:", rec.case_number)
    print("decision_date:", rec.decision_date)
    print("court_name:", rec.court_name)
    print("judgment_type:", rec.judgment_type)

    print("\n[ TEXT FIELDS ]")
    print("issues:", (rec.issues or "")[:200], "...")
    print("summary:", (rec.summary or "")[:200], "...")
    print("referenced_laws:", (rec.referenced_laws or "")[:200], "...")

    if rec.full_text:
        print("\n[ FULL TEXT ]")
        print("length:", len(rec.full_text))
        print(rec.full_text[:300], "...")
    else:
        print("\n[ FULL TEXT ] None")


if __name__ == "__main__":
    main()
