# 06_langchain_step_names.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict

from langchain_core.runnables import RunnableLambda, RunnableSequence

from service_rag import run_layered_rag, LayeredRAGResult
from prompt_templates import build_messages_for_llm
from llm_client_groq import GroqLLMClient, GroqLLMConfig


@dataclass(frozen=True)
class RagParams:
    top_k_law: int = 2
    top_k_precedent: int = 2
    top_k_mediation: int = 1
    top_n_evidence_raw: int = 6
    top_n_evidence_final: int = 1


def step_rag(inp: Dict[str, Any]) -> Dict[str, Any]:
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


def step_build_messages(inp: Dict[str, Any]) -> Dict[str, Any]:
    rag_result: LayeredRAGResult = inp["rag_result"]
    messages = build_messages_for_llm(rag_result)
    return {**inp, "messages": messages}


def step_llm(inp: Dict[str, Any]) -> Dict[str, Any]:
    llm: GroqLLMClient = inp["llm"]
    messages = inp["messages"]
    answer = llm.generate(messages)
    return {**inp, "answer": answer}


def build_chain() -> RunnableSequence:
    rag = RunnableLambda(step_rag).with_config(run_name="01_rag_layered")
    prompt = RunnableLambda(step_build_messages).with_config(
        run_name="02_prompt_messages"
    )
    llm = RunnableLambda(step_llm).with_config(run_name="03_llm_groq_generate")

    return RunnableSequence(rag, prompt, llm)


def main() -> None:
    clause_text = """
임차인은 임대인의 사전 동의 없이 반려동물을 사육할 수 없다.
임대인의 동의를 받아 반려동물을 사육하는 경우에도, 소음·악취·훼손 등으로 인한 민원이 발생하지 않도록 관리할 의무를 부담하며,
퇴거 시 원상복구 비용은 임차인이 부담한다.
""".strip()

    llm = GroqLLMClient(
        cfg=GroqLLMConfig(
            model="llama-3.1-8b-instant",
            temperature=0.1,
            max_tokens=512,
            user_max_chars=9000,
            retry=2,
        )
    )

    rag_params = RagParams()

    chain = build_chain()
    out = chain.invoke(
        {
            "clause_text": clause_text,
            "rag_params": rag_params,
            "llm": llm,
        }
    )

    print(out["answer"])


if __name__ == "__main__":
    main()
