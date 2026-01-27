# test_evidence_extractor.py
from __future__ import annotations

from sentence_transformers import SentenceTransformer

from config import RAG
from retriever_precedent_headnote import retrieve_precedent_headnote
from precedent_repo import fetch_precedents_by_ids
from evidence_extractor_bm25 import extract_evidence_bm25
from evidence_filters import rerank_and_filter_evidence


def _snip(s: str, n: int = 350) -> str:
    s = (s or "").replace("\n", " ").strip()
    return s[:n] + ("..." if len(s) > n else "")


def main() -> None:
    clause = """
임차인은 계약기간 중 임대인의 동의 없이 전대하거나 임차권을 양도할 수 없으며,
이를 위반할 경우 임대인은 즉시 계약을 해지할 수 있다.
""".strip()

    top_k_precedent = 5  # headnote 후보 수
    top_n_evidence_raw = 8  # BM25로 넉넉히 뽑고
    top_n_evidence_final = 3  # 필터/재랭킹 후 최종 N개만 출력

    print("=" * 90)
    print("[CLAUSE]")
    print(clause)
    print("=" * 90)

    model = SentenceTransformer(RAG.embedding_model_name)

    # 1) headnote 후보 검색
    head_hits = retrieve_precedent_headnote(
        clause,
        top_k=top_k_precedent,
        model=model,
    )
    if not head_hits:
        print("[WARN] no precedent headnote hits")
        return

    print("\n[1] HEADNOTE HITS")
    for i, h in enumerate(head_hits, start=1):
        print(
            f"- {i}. distance={h.distance:.4f} precedent_id={h.precedent_id} "
            f"case_name={h.case_name} case_number={h.case_number} decision_date={h.decision_date}"
        )

    precedent_ids = [h.precedent_id for h in head_hits]

    # 2) full_text 로드
    rec_map = fetch_precedents_by_ids(precedent_ids, include_full_text=True)
    records = []
    for pid in precedent_ids:
        rec = rec_map.get(pid)
        if rec:
            records.append(rec)

    if not records:
        print("\n[FAIL] no full_text records loaded")
        return

    print("\n[2] LOADED FULLTEXT")
    for r in records:
        print(f"- precedent_id={r.precedent_id} full_text_len={len(r.full_text or '')}")

    # 3) BM25로 근거 문단 넉넉히 추출
    ev_map = extract_evidence_bm25(
        clause_text=clause,
        precedents=records,
        top_n_per_case=top_n_evidence_raw,
        min_paragraph_chars=40,
    )
    if not ev_map:
        print("\n[WARN] no evidence extracted (all scores 0?)")
        return

    # 4) 필터/재랭킹 적용 후 출력
    print("\n[3] EVIDENCE (BM25 -> FILTER/RERANK -> FINAL)")
    for pid in precedent_ids:
        spans = ev_map.get(pid, [])
        if not spans:
            continue

        case_name = next(
            (h.case_name for h in head_hits if h.precedent_id == pid), None
        )

        ranked = rerank_and_filter_evidence(
            spans,
            drop_formal=True,  # 형식 문단 제거
            min_adjusted_score=0.0,
        )
        ranked = ranked[:top_n_evidence_final]

        if not ranked:
            continue

        print("\n" + "-" * 90)
        print(f"precedent_id={pid} case_name={case_name}")

        for j, item in enumerate(ranked, start=1):
            ev = item.span
            print(
                f"\n  [{j}] adjusted={item.adjusted_score:.4f} "
                f"(bm25={ev.score:.4f}) paragraph_index={ev.paragraph_index}"
            )
            print("   ", _snip(ev.text))

    print("\n[DONE] test_evidence_extractor completed")


if __name__ == "__main__":
    main()
