# 05_langsmith_tracing.py
from __future__ import annotations

import os
from dotenv import load_dotenv

from langchain_core.runnables import RunnableConfig

from .langchain_step_names import build_chain, RagParams
from .llm_client_groq import GroqLLMClient, GroqLLMConfig


def main() -> None:
    load_dotenv()

    # -----------------------------
    # 1) LangSmith env 체크
    # -----------------------------
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
    # ✅ "좋은 모델 기본" 가정: 70B 계열로 고정
    # ✅ JSON/장문 출력 안정성: max_tokens 충분히 확보
    llm = GroqLLMClient(
        cfg=GroqLLMConfig(
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=1600,  # 512면 JSON/근거 출력이 잘릴 확률 큼
            user_max_chars=9000,  # 길면 shrink에서 잘림
            retry=2,
        )
    )

    # ✅ 너무 타이트하면 "근거 부족"이 나와서 LLM이 억지로 채우거나 빈약해짐
    #    (지금은 테스트니까 최소한 law/precedent/mediation을 조금 넉넉하게)
    rag_params = RagParams(
        top_k_law=4,
        top_k_precedent=8,
        top_k_mediation=3,
        top_n_evidence_raw=10,
        top_n_evidence_final=2,
    )

    chain = build_chain()

    # -----------------------------
    # 4) RunnableConfig로 tracing 메타데이터 부여
    # -----------------------------
    config = RunnableConfig(
        run_name="clause_analyze_pipeline",
        tags=["rag", "lease", "groq", "layered", "json"],
        metadata={
            "top_k_law": rag_params.top_k_law,
            "top_k_precedent": rag_params.top_k_precedent,
            "top_k_mediation": rag_params.top_k_mediation,
            "top_n_evidence_raw": rag_params.top_n_evidence_raw,
            "top_n_evidence_final": rag_params.top_n_evidence_final,
            "model": llm.cfg.model,
            "max_tokens": llm.cfg.max_tokens,
            "user_max_chars": llm.cfg.user_max_chars,
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
