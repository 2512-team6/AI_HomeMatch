# smoke_query.py
from __future__ import annotations

from typing import Any, Dict, List, Tuple

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from config import RAG


def get_chroma_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(
        path=str(RAG.chroma_dir),
        settings=Settings(anonymized_telemetry=False),
    )


def _embed(model: SentenceTransformer, text: str) -> List[float]:
    # bge-m3: normalize_embeddings=True 권장 (코사인 유사도 안정)
    vec = model.encode([text], normalize_embeddings=True, show_progress_bar=False)[0]
    return vec.tolist()


def _snippet(s: str, n: int = 220) -> str:
    s = (s or "").replace("\n", " ").strip()
    return s[:n] + ("..." if len(s) > n else "")


def query_collection(
    *,
    client: chromadb.PersistentClient,
    model: SentenceTransformer,
    collection_name: str,
    query_text: str,
    top_k: int,
) -> List[Tuple[str, str, Dict[str, Any], float]]:
    """
    return: [(id, document, metadata, distance), ...]
    distance는 Chroma 설정에 따라 의미가 달라질 수 있음.
    (많은 경우 distance가 작을수록 유사)
    """
    col = client.get_or_create_collection(name=collection_name)
    q_emb = _embed(model, query_text)

    res = col.query(
        query_embeddings=[q_emb],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    ids = res.get("ids", [[]])[0]
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    dists = res.get("distances", [[]])[0]

    out: List[Tuple[str, str, Dict[str, Any], float]] = []
    for i in range(len(ids)):
        out.append((ids[i], docs[i], metas[i] or {}, float(dists[i])))
    return out


def main() -> None:
    # ✅ 여기에 테스트할 특약 텍스트 넣기
    clause = """
임차인은 계약기간 중 임대인의 동의 없이 전대하거나 임차권을 양도할 수 없으며,
이를 위반할 경우 임대인은 즉시 계약을 해지할 수 있다.
""".strip()

    top_k = 5

    client = get_chroma_client()
    model = SentenceTransformer(RAG.embedding_model_name)

    targets = [
        ("LAW", RAG.datasets["law"].collection_name),
        ("PRECEDENT_HEADNOTE", RAG.datasets["precedent"].collection_name),
        ("MEDIATION", RAG.datasets["mediation"].collection_name),
    ]

    print("=" * 80)
    print("[QUERY]")
    print(clause)
    print("=" * 80)

    for label, col_name in targets:
        print(f"\n--- {label} | collection={col_name} | top_k={top_k} ---")
        rows = query_collection(
            client=client,
            model=model,
            collection_name=col_name,
            query_text=clause,
            top_k=top_k,
        )

        if not rows:
            print("(no results)")
            continue

        for rank, (doc_id, doc_text, meta, dist) in enumerate(rows, start=1):
            # 보기 좋게 핵심 메타만 일부 노출
            brief_meta = {}
            for k in [
                "doc_id",
                "parent_doc_id",
                "precedent_id",
                "case_name",
                "case_number",
                "decision_date",
                "source_name",
                "title",
                "case_id",
            ]:
                if k in meta:
                    brief_meta[k] = meta[k]

            print(f"\n[{rank}] distance={dist}")
            print(f"  id: {doc_id}")
            if brief_meta:
                print(f"  meta: {brief_meta}")
            else:
                print("  meta: (empty)")
            print(f"  text: {_snippet(doc_text)}")


if __name__ == "__main__":
    main()
