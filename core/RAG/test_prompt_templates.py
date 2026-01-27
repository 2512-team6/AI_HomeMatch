# test_prompt_templates.py
from __future__ import annotations

from sentence_transformers import SentenceTransformer

from config import RAG
from service_rag import run_layered_rag
from prompt_templates import (
    build_messages_for_llm,
    build_context_block,
    OUTPUT_FORMAT,
)


def main() -> None:
    clause = """
임차인은 계약기간 중 임대인의 동의 없이 전대하거나 임차권을 양도할 수 없으며,
이를 위반할 경우 임대인은 즉시 계약을 해지할 수 있다.
""".strip()

    # 임베딩 모델 1회 로드(속도)
    model = SentenceTransformer(RAG.embedding_model_name)

    # RAG 결과 생성
    result = run_layered_rag(
        clause_text=clause,
        top_k_law=4,
        top_k_precedent=8,
        top_k_mediation=4,
        top_n_evidence_raw=10,
        top_n_evidence_final=2,
        model=model,
    )

    # 컨텍스트 블록(LLM에 들어갈 근거 텍스트)만 먼저 확인
    context_block = build_context_block(
        result,
        law_max_chars_per_hit=900,
        precedent_headnote_max_chars_per_hit=700,
        evidence_max_paragraphs_per_case=1,
        evidence_max_chars_per_paragraph=650,
        mediation_max_chars_per_hit=900,
    )

    print("=" * 100)
    print("[CONTEXT BLOCK]")
    print("=" * 100)
    print(context_block)
    print("=" * 100)
    print(f"[context chars] {len(context_block)}")
    print("=" * 100)

    # 최종 메시지(시스템/유저) 확인
    messages = build_messages_for_llm(result, output_format=OUTPUT_FORMAT)

    print("\n" + "=" * 100)
    print("[MESSAGES]")
    print("=" * 100)
    for i, m in enumerate(messages, start=1):
        role = m["role"]
        content = m["content"]
        print(f"\n--- message {i} role={role} chars={len(content)} ---")
        print(content)

    total_chars = sum(len(m["content"]) for m in messages)
    print("\n" + "=" * 100)
    print(f"[total message chars] {total_chars}")
    print("=" * 100)


if __name__ == "__main__":
    main()
