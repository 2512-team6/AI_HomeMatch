from __future__ import annotations

from typing import Any, Dict, List

from config import RAG
from retrieve import retrieve


def build_context(hits: List[Dict[str, Any]], max_chars_per_hit: int = 1200) -> str:
    """
    Top-K 검색 결과를 LLM에 넣을 '근거(context)'로 합친다.

    - 법률 텍스트가 매우 길 수 있으니, hit당 max_chars_per_hit로 잘라서
      전체 프롬프트 폭주를 막는다.
    - 각 근거마다 출처 메타(case_id/section/part/title)를 헤더로 붙인다.
    """
    blocks: List[str] = []
    for i, h in enumerate(hits, start=1):
        m = h["meta"]  # dict
        header = (
            f"[{i}] case_id={m.get('case_id')} | section={m.get('section')} "
            f"| part={m.get('part_index')}/{m.get('part_count')} "
            f"| title={m.get('title','')}"
        )
        text = str(h["text"]).strip()
        if len(text) > max_chars_per_hit:
            text = text[:max_chars_per_hit] + "\n...(생략)..."

        blocks.append(header + "\n" + text)

    return "\n\n---\n\n".join(blocks)


def generate_answer_ollama(question: str, context: str, model: str = "llama3.1") -> str:
    """
    Ollama로 답변 생성.
    - 반드시 근거(context)에 있는 내용만 사용하도록 강제한다.
    - 근거에 없으면 '근거 부족'이라고 말하게 한다.
    """
    import ollama

    system = (
        "너는 주택임대차 분쟁조정 사례집(벡터DB 검색 결과)을 근거로만 답하는 도우미다.\n"
        "규칙:\n"
        "1) 아래 [근거]에 포함된 내용만 사용한다.\n"
        "2) 근거에 없는 내용은 추측하지 말고 '근거 부족'이라고 말한다.\n"
        "3) 답변 마지막에 사용한 근거의 case_id/section을 짧게 나열한다.\n"
    )

    user = f"""
[질문]
{question}

[근거]
{context}
""".strip()

    resp = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        options={
            "temperature": 0.0,
            "num_predict": 400,
        },
    )
    return resp["message"]["content"]


def main():
    while True:
        q = input("\n질문 입력 (종료: q): ").strip()
        if not q:
            continue
        if q.lower() == "q":
            break

        hits = retrieve(q, top_k=RAG.top_k)

        # 근거 만들기
        context = build_context(hits, max_chars_per_hit=1200)

        # 답변 생성
        ans = generate_answer_ollama(q, context, model="gemma3:4b")

        print("\n========== ANSWER ==========")
        print(ans)


if __name__ == "__main__":
    main()
