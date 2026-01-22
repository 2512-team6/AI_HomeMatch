from __future__ import annotations

from typing import Any, Dict, List

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from config import RAG


def get_collection():
    client = chromadb.PersistentClient(
        path=str(RAG.chroma_dir), settings=Settings(anonymized_telemetry=False)
    )
    return client.get_or_create_collection(name=RAG.collection_name)


def retrieve(query: str, top_k: int | None = None) -> List[Dict[str, Any]]:

    top_k = top_k or RAG.top_k

    model = SentenceTransformer(RAG.embedding_model_name)
    q_emb = model.encode([query], normalize_embeddings=True).tolist()[0]

    col = get_collection()
    res = col.query(
        query_embeddings=[q_emb],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    docs = res["documents"][0]
    metas = res["metadatas"][0]
    print("meta 정보: ", type(metas[0]), metas[0])
    dists = res["distances"][0]

    out: List[Dict[str, Any]] = []
    for doc, meta, dist in zip(docs, metas, dists):
        out.append({"text": doc, "meta": meta, "distance": float(dist)})
    return out


def preview_hits(hits: List[Dict[str, Any]], max_chars: int = 500):

    print("\n========== TOP-K HITS ==========")
    for i, h in enumerate(hits, start=1):
        m = h.get("meta")

        # 메타가 dict가 아니면(예: str) 안전 처리
        if isinstance(m, dict):
            case_id = m.get("case_id")
            section = m.get("section")
            part_index = m.get("part_index")
            part_count = m.get("part_count")
            title = m.get("title", "")
            meta_line = (
                f"case_id={case_id} | section={section} | "
                f"part={part_index}/{part_count} | title={title}"
            )
        else:
            meta_line = f"meta={m}"  # 문자열/None 등은 그냥 그대로 출력

        print(f"[{i}] dist={h['distance']:.4f} | {meta_line}")
        snippet = str(h["text"]).replace("\n", " ")
        print("  text:", snippet[:max_chars])
        print()


def main():
    while True:
        q = input("\n질문 입력 (종료: q): ").strip()
        if not q:
            continue
        if q.lower() == "q":
            break

        hits = retrieve(q, top_k=RAG.top_k)
        preview_hits(hits, max_chars=500)


if __name__ == "__main__":
    main()
