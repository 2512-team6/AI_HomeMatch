from .service_rag import run_layered_rag
from .prompt_templates import build_messages_for_llm
from .llm_client_groq import GroqLLMClient


def main():
    clause_text = """임차인은 계약 종료 시 입주 당시 상태로 원상복구하되, 통상적인 사용으로 인한 마모(도배·장판의 자연 손상)는 원상복구 대상에서 제외한다.""".strip()

    rag = run_layered_rag(
        clause_text=clause_text,
        top_k_law=2,
        top_k_precedent=2,
        top_k_mediation=1,
        top_n_evidence_final=1,
    )

    messages = build_messages_for_llm(rag)

    llm = GroqLLMClient()
    answer = llm.generate(messages)
    print(answer)


if __name__ == "__main__":
    main()
