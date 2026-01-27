# test_service_rag.py
from __future__ import annotations

from sentence_transformers import SentenceTransformer

from config import RAG
from service_rag import run_layered_rag


def _snip(s: str, n: int = 260) -> str:
    s = (s or "").replace("\n", " ").strip()
    return s[:n] + ("..." if len(s) > n else "")


def main() -> None:
    clause = """
임차인은 계약기간 중 임대인의 동의 없이 전대하거나 임차권을 양도할 수 없으며,
이를 위반할 경우 임대인은 즉시 계약을 해지할 수 있다.
""".strip()

    # 임베딩 모델은 한 번만 로드(속도)
    model = SentenceTransformer(RAG.embedding_model_name)

    result = run_layered_rag(
        clause_text=clause,
        top_k_law=4,
        top_k_precedent=8,
        top_k_mediation=4,
        top_n_evidence_raw=10,
        top_n_evidence_final=3,
        model=model,
    )

    print("=" * 90)
    print("[CLAUSE]")
    print(result.clause_text)
    print("=" * 90)

    # -----------------------------
    # LAW
    # -----------------------------
    print("\n[LAW HITS]")
    for i, h in enumerate(result.law_hits, start=1):
        meta = h.doc.metadata or {}
        print(
            f"- {i}. distance={h.distance:.4f} doc_id={meta.get('doc_id')} title={meta.get('title')}"
        )
        print("   ", _snip(h.doc.page_content))

    # -----------------------------
    # PRECEDENT (HEADNOTE)
    # -----------------------------
    print("\n[PRECEDENT HEADNOTE HITS]")
    for i, h in enumerate(result.precedent_headnote_hits, start=1):
        print(
            f"- {i}. distance={h.distance:.4f} precedent_id={h.precedent_id} "
            f"case_name={h.case_name} case_number={h.case_number} decision_date={h.decision_date}"
        )
        print("   ", _snip(h.doc.page_content))

    # -----------------------------
    # PRECEDENT EVIDENCE
    # -----------------------------
    print("\n[PRECEDENT EVIDENCE (BM25 + FILTER/RERANK)]")
    for pid, ranked_list in result.precedent_evidence.items():
        rec = result.precedent_fulltext.get(pid)
        case_name = rec.case_name if rec else None
        print("\n" + "-" * 90)
        print(f"precedent_id={pid} case_name={case_name}")

        if not ranked_list:
            print("  (no evidence after filtering)")
            continue

        for j, item in enumerate(ranked_list, start=1):
            ev = item.span
            print(
                f"  [{j}] adjusted={item.adjusted_score:.4f} bm25={ev.score:.4f} paragraph_index={ev.paragraph_index}"
            )
            print("      ", _snip(ev.text, 360))

    # -----------------------------
    # MEDIATION
    # -----------------------------
    print("\n[MEDIATION HITS]")
    for i, h in enumerate(result.mediation_hits, start=1):
        meta = h.doc.metadata or {}
        print(
            f"- {i}. distance={h.distance:.4f} doc_id={meta.get('doc_id')} title={meta.get('title')}"
        )
        print("   ", _snip(h.doc.page_content))

    print("\n[DONE] test_service_rag completed")


if __name__ == "__main__":
    main()
