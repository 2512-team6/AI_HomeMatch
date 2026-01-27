# 05_langsmith_tracing.py
from __future__ import annotations

import os
from dotenv import load_dotenv

from langchain_core.runnables import RunnableConfig

from langchain_step_names import build_chain, RagParams  # 너의 파일명에 맞춰 import
from llm_client_groq import GroqLLMClient, GroqLLMConfig


def main() -> None:
    load_dotenv()

    # -----------------------------
    # 1) LangSmith env 체크
    # -----------------------------
    # .env 에 아래 값들이 있어야 함:
    # LANGCHAIN_TRACING_V2=true
    # LANGCHAIN_API_KEY=ls__...
    # LANGCHAIN_PROJECT=AI_HomeMatch-RAG (원하는 이름)
    #
    # 선택:
    # LANGCHAIN_ENDPOINT=https://api.smith.langchain.com  (보통 기본값이라 없어도 됨)

    if os.getenv("LANGCHAIN_TRACING_V2", "").lower() not in ("true", "1", "yes", "on"):
        print(
            "[WARN] LANGCHAIN_TRACING_V2 가 true가 아님. tracing이 기록되지 않을 수 있음."
        )

    if not os.getenv("LANGCHAIN_API_KEY"):
        raise RuntimeError("LANGCHAIN_API_KEY 가 비어있음 (.env에 추가 필요)")

    project = os.getenv("LANGCHAIN_PROJECT", "AI_HomeMatch-RAG")
    print(f"[INFO] LangSmith project = {project}")

    # -----------------------------
    # 2) 입력
    # -----------------------------
    clause_text = """
임차인은 임대인의 사전 동의 없이 반려동물을 사육할 수 없다.
임대인의 동의를 받아 반려동물을 사육하는 경우에도, 소음·악취·훼손 등으로 인한 민원이 발생하지 않도록 관리할 의무를 부담하며, 퇴거 시 원상복구 비용은 임차인이 부담한다.
""".strip()

    # -----------------------------
    # 3) LLM / RAG 파라미터
    # -----------------------------
    llm = GroqLLMClient(
        cfg=GroqLLMConfig(
            model="llama-3.1-8b-instant",
            temperature=0.1,
            max_tokens=512,
            user_max_chars=9000,
            retry=2,
        )
    )

    rag_params = RagParams(
        top_k_law=2,
        top_k_precedent=2,
        top_k_mediation=1,
        top_n_evidence_raw=6,
        top_n_evidence_final=1,
    )

    chain = build_chain()

    # -----------------------------
    # 4) RunnableConfig로 tracing 메타데이터 부여
    # -----------------------------
    config = RunnableConfig(
        run_name="clause_analyze_pipeline",
        tags=["rag", "lease", "groq", "layered"],
        metadata={
            "top_k_law": rag_params.top_k_law,
            "top_k_precedent": rag_params.top_k_precedent,
            "top_k_mediation": rag_params.top_k_mediation,
            "model": llm.cfg.model,
        },
    )

    # -----------------------------
    # 5) 실행 (LangSmith에 trace 기록됨)
    # -----------------------------
    out = chain.invoke(
        {
            "clause_text": clause_text,
            "rag_params": rag_params,
            "llm": llm,
        },
        config=config,
    )

    print("\n========== ANSWER ==========\n")
    print(out["answer"])
    print("\n============================\n")


if __name__ == "__main__":
    main()
