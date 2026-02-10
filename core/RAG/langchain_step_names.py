# 06_langchain_step_names.py
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from langchain_core.runnables import RunnableLambda, RunnableSequence

from .config import RAG
from .service_rag import run_layered_rag, LayeredRAGResult
from .prompt_templates import build_messages_for_llm
from .llm_client_groq import GroqLLMClient


# 출력 포맷은 prompt_templates.OUTPUT_FORMAT 단일 출처 사용 (중복 정의 제거)


@dataclass(frozen=True)
class RagParams:
    """검색 개수 기본값은 config.RAG.top_k 사용 (단일 출처)."""

    top_k_law: int = RAG.top_k
    top_k_precedent: int = RAG.top_k
    top_k_mediation: int = RAG.top_k
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


def _try_parse_json(text: str) -> bool:
    try:
        json.loads(text)
        return True
    except Exception:
        return False


def _extract_json_object(s: str) -> Optional[Dict[str, Any]]:
    """
    LLM 출력에서 JSON 객체 한 덩어리만 추출해 파싱.
    앞뒤 설명/키:값 나열이 섞여 있어도 첫 '{' ~ 마지막 '}' 구간으로 파싱 시도.
    """
    if not (s or s.strip()):
        return None
    ss = s.strip()
    start = ss.find("{")
    if start == -1:
        return None
    end = ss.rfind("}")
    if end == -1 or end <= start:
        return None
    try:
        obj = json.loads(ss[start : end + 1])
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


def step_postprocess(inp: Dict[str, Any]) -> Dict[str, Any]:
    answer = (inp.get("answer") or "").strip()
    obj: Optional[Dict[str, Any]] = None
    try:
        obj = json.loads(answer)
    except Exception:
        obj = _extract_json_object(answer)
    if not obj or not isinstance(obj, dict):
        return inp

    # 이하 기존 정제 로직: color, _ids 등 보강

    # -----------------------------
    # 1) level / color sanitize (3-level)
    # -----------------------------
    raw_level = (obj.get("level") or "").strip().upper()

    # 과거 스키마/과대평가 방어
    if raw_level == "NEED_FIX":
        level = "NEED_REVIEW"
    elif raw_level in ("SAFE", "NEED_UNDERSTAND", "NEED_REVIEW"):
        level = raw_level
    else:
        # 알 수 없는 값이면 중간 단계로 보정
        level = "NEED_UNDERSTAND"

    obj["level"] = level

    color_map = {
        "SAFE": "green",
        "NEED_UNDERSTAND": "yellow",
        "NEED_REVIEW": "orange",
    }
    obj["color"] = color_map[level]

    # -----------------------------
    # 2) recommendations 강제
    # -----------------------------
    # NEED_REVIEW에서만 허용
    if level in ("SAFE", "NEED_UNDERSTAND"):
        obj["recommendations"] = []

    # -----------------------------
    # 3) 리스트 길이 제한 강제
    # -----------------------------
    def _cap_list(key: str, n: int):
        v = obj.get(key, [])
        if isinstance(v, list):
            obj[key] = v[:n]
        else:
            obj[key] = []

    _cap_list("risk_points", 3)
    _cap_list("mediation_cases", 2)
    _cap_list("precedents", 2)
    _cap_list("laws", 3)
    _cap_list("recommendations", 2)

    # LLM이 배열 키를 안 넣었을 수 있으므로 기본 보강
    for key in ("mediation_cases", "precedents", "laws"):
        if key not in obj or not isinstance(obj[key], list):
            obj[key] = []
    for key in ("mediation_case_ids", "precedent_ids", "law_ids"):
        if key not in obj or not isinstance(obj[key], list):
            obj[key] = []

    # -----------------------------
    # 4) source_id ↔ ids 동기화
    # -----------------------------
    def _sync_ids(items_key: str, ids_key: str):
        items = obj.get(items_key, [])
        if not isinstance(items, list):
            obj[items_key] = []
            obj[ids_key] = []
            return
        ids = []
        for it in items:
            if isinstance(it, dict):
                sid = it.get("source_id")
                if isinstance(sid, str) and sid:
                    ids.append(sid)
        obj[ids_key] = ids

    _sync_ids("mediation_cases", "mediation_case_ids")
    _sync_ids("precedents", "precedent_ids")
    _sync_ids("laws", "law_ids")

    # -----------------------------
    # 5) precedent evidence 강제
    # -----------------------------
    # evidence_paragraphs가 비어 있으면 그 판례는 제거
    precedents = obj.get("precedents", [])
    if isinstance(precedents, list):
        cleaned: List[Dict[str, Any]] = []
        for p in precedents:
            if not isinstance(p, dict):
                continue
            ev = p.get("evidence_paragraphs", [])
            if isinstance(ev, list) and len(ev) > 0:
                cleaned.append(p)
        obj["precedents"] = cleaned
        _sync_ids("precedents", "precedent_ids")

    # -----------------------------
    # 6) 최종 JSON 재직렬화
    # -----------------------------
    inp["answer"] = json.dumps(obj, ensure_ascii=False)
    return inp


def step_llm(inp: Dict[str, Any]) -> Dict[str, Any]:
    llm: GroqLLMClient = inp["llm"]
    messages: List[Dict[str, str]] = inp["messages"]

    answer = llm.generate(messages) or ""

    # ✅ 1차: JSON 파싱 실패면 "리페어 1회"만 시도
    if not _try_parse_json(answer):
        repair_messages = [
            {
                "role": "system",
                "content": "You are a JSON formatter. Return ONLY valid JSON. No markdown, no extra text.",
            },
            {
                "role": "user",
                "content": (
                    "다음 텍스트를 규칙에 맞는 유효한 JSON으로만 변환해줘. "
                    "키는 그대로 유지하고, 근거 없는 항목은 []로 비워.\n\n"
                    f"{answer}"
                ),
            },
        ]
        repaired = llm.generate(repair_messages) or ""
        if _try_parse_json(repaired):
            answer = repaired

    return {**inp, "answer": answer}


def build_chain() -> RunnableSequence:
    rag = RunnableLambda(step_rag).with_config(run_name="01_rag_layered")
    prompt = RunnableLambda(step_build_messages).with_config(
        run_name="02_prompt_messages"
    )
    llm = RunnableLambda(step_llm).with_config(run_name="03_llm_groq_generate")
    post = RunnableLambda(step_postprocess).with_config(run_name="04_postprocess")

    return RunnableSequence(rag, prompt, llm, post)


def main() -> None:
    clause_text = """
임차인은 임대인의 사전 동의 없이 반려동물을 사육할 수 없다.
임대인의 동의를 받아 반려동물을 사육하는 경우에도, 소음·악취·훼손 등으로 인한 민원이 발생하지 않도록 관리할 의무를 부담하며,
퇴거 시 원상복구 비용은 임차인이 부담한다.
""".strip()

    # ✅ langsmith_tracing.py에서 주입하는 llm 설정을 따르는 게 정석이지만,
    # 여기 main은 로컬 테스트용이므로 남겨둠.
    from llm_client_groq import GroqLLMConfig  # 순환 import 방지용 로컬 import

    llm = GroqLLMClient(
        cfg=GroqLLMConfig(
            # 좋은 모델 기본 가정이면 여기만 바꾸면 됨:
            model="llama-3.3-70b-versatile",
            # model="llama-3.1-8b-instant",
            temperature=0.1,
            max_tokens=1600,  # ✅ JSON 잘림 방지
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
