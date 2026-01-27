# 04_langchain_runnable.py
"""
LangChain Runnable로 전체 파이프라인을 하나로 묶는다.

Input:  clause_text (str)
Flow:   clause_text -> run_layered_rag -> build_messages_for_llm -> GroqLLMClient.generate -> answer (str)

주의:
- langchain-core만 필요 (langchain 전체 X)
- Groq 호출은 03_llm_client_groq.py의 GroqLLMClient를 그대로 사용
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict

from langchain_core.runnables import RunnableLambda, RunnableSequence

from service_rag import run_layered_rag, LayeredRAGResult
from prompt_templates import build_messages_for_llm

# 네가 만들었던 Groq 클라이언트 파일명에 맞춰 import 수정해줘
# (내가 이전에 제안한 이름: 03_llm_client_groq.py)
from llm_client_groq import GroqLLMClient, GroqLLMConfig


@dataclass(frozen=True)
class RagParams:
    top_k_law: int = 2
    top_k_precedent: int = 2
    top_k_mediation: int = 1
    top_n_evidence_raw: int = 6
    top_n_evidence_final: int = 1


def _step_rag(inp: Dict[str, Any]) -> Dict[str, Any]:
    clause_text = (inp.get("clause_text") or "").strip()
    if not clause_text:
        raise ValueError("clause_text is empty")

    params: RagParams = inp.get("rag_params") or RagParams()

    rag_result: LayeredRAGResult = run_layered_rag(
        clause_text=clause_text,
        top_k_law=params.top_k_law,
        top_k_precedent=params.top_k_precedent,
        top_k_mediation=params.top_k_mediation,
        top_n_evidence_raw=params.top_n_evidence_raw,
        top_n_evidence_final=params.top_n_evidence_final,
    )

    return {**inp, "rag_result": rag_result}


def _step_build_messages(inp: Dict[str, Any]) -> Dict[str, Any]:
    rag_result: LayeredRAGResult = inp["rag_result"]
    messages = build_messages_for_llm(rag_result)
    return {**inp, "messages": messages}


def _step_llm(inp: Dict[str, Any]) -> Dict[str, Any]:
    llm: GroqLLMClient = inp["llm"]
    messages = inp["messages"]
    answer = llm.generate(messages)
    return {**inp, "answer": answer}


def build_chain(
    *,
    rag_params: RagParams | None = None,
    llm_cfg: GroqLLMConfig | None = None,
) -> RunnableSequence:
    """
    Runnable 입력 형태:
      {"clause_text": "...", "rag_params": RagParams(...), "llm": GroqLLMClient(...)}

    편의상 기본 rag_params/llm은 main()에서 주입해 사용.
    """
    chain = RunnableSequence(
        RunnableLambda(_step_rag),
        RunnableLambda(_step_build_messages),
        RunnableLambda(_step_llm),
    )
    return chain


def main() -> None:
    # 1) 테스트 입력
    clause_text = """
임차인은 임대인의 사전 서면 동의 없이 목적물의 전부 또는 일부를 전대하거나 임차권을 양도할 수 없다.
이를 위반한 경우 임대인은 최고 없이 계약을 해지할 수 있다.
""".strip()

    # 2) LLM client 준비
    llm = GroqLLMClient(
        cfg=GroqLLMConfig(
            model="llama-3.1-8b-instant",
            temperature=0.1,
            max_tokens=512,  # 파이프라인 우선이라 보수적으로
            user_max_chars=9000,  # TPM 회피용
            retry=2,
        )
    )

    # 3) RAG 파라미터 (현재는 축소값)
    rag_params = RagParams(
        top_k_law=2,
        top_k_precedent=2,
        top_k_mediation=1,
        top_n_evidence_raw=6,
        top_n_evidence_final=1,
    )

    # 4) 체인 실행
    chain = build_chain()
    out = chain.invoke(
        {
            "clause_text": clause_text,
            "rag_params": rag_params,
            "llm": llm,
        }
    )

    # 5) 결과
    print("\n========== ANSWER ==========\n")
    print(out["answer"])
    print("\n============================\n")

    # 필요하면 디버그용으로 이것도 찍어볼 수 있음
    # print("LAW hits:", len(out["rag_result"].law_hits))
    # print("PREC hits:", len(out["rag_result"].precedent_headnote_hits))
    # print("MED hits:", len(out["rag_result"].mediation_hits))


if __name__ == "__main__":
    main()
