# api_server.py
from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="AI_HomeMatch RAG API")

# core/register.py 를 import할 수 있도록 core 경로를 sys.path에 추가
_CORE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _CORE_DIR not in sys.path:
    sys.path.insert(0, _CORE_DIR)

try:
    from register import router as deed_router  # type: ignore

    app.include_router(deed_router)
except Exception as e:
    # 등기부 모듈이 없어도 계약서 API는 동작하게 유지
    # (실제 오류는 서버 콘솔에서 확인)
    print("[WARN] register router load failed:", repr(e))

_chain: Any = None
_llm: Any = None


def _get_chain_and_llm():
    """
    계약서 RAG 전용 chain/llm을 lazy-init.
    - langchain/groq 의존성 또는 GROQ_API_KEY가 없으면 503으로 안내
    - 등기부(register) API는 이 실패와 무관하게 동작 가능
    """
    global _chain, _llm
    if _chain is not None and _llm is not None:
        return _chain, _llm

    try:
        from langchain_step_names import build_chain  # type: ignore
        from llm_client_groq import GroqLLMClient, GroqLLMConfig  # type: ignore
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"RAG 의존성 로드 실패: {e!r}")

    try:
        _chain = build_chain()
        _llm = GroqLLMClient(
            cfg=GroqLLMConfig(
                model="llama-3.3-70b-versatile",
                temperature=0.1,
                max_tokens=1600,
                user_max_chars=9000,
                retry=2,
            )
        )
        return _chain, _llm
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"RAG 초기화 실패(GROQ_API_KEY 등 확인): {e!r}")


# -----------------------------
# Schemas
# -----------------------------
class AnalyzeRequest(BaseModel):
    clause_text: str = Field(..., min_length=1)
    rag_params: Optional[Dict[str, Any]] = None  # 없으면 기본값 사용
    strict: bool = False  # True면 JSON 파싱 실패 시 502로 실패 처리
    debug: bool = False  # True면 디버그 정보 포함(필요 시)


class AnalyzeResponse(BaseModel):
    ok: bool
    answer_raw: str
    answer_json: Optional[Dict[str, Any]] = None
    parse_error: bool = False
    error_message: Optional[str] = None


def _parse_rag_params(rag_params: Optional[Dict[str, Any]]):
    try:
        from langchain_step_names import RagParams  # type: ignore

        return RagParams(**rag_params) if rag_params else RagParams()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid rag_params: {e!r}")


def _invoke_chain(*, clause_text: str, params: Any) -> str:
    chain, llm = _get_chain_and_llm()
    out = chain.invoke(
        {
            "clause_text": clause_text,
            "rag_params": params,
            "llm": llm,
        }
    )
    return (out.get("answer") or "").strip()


# -----------------------------
# Endpoints
# -----------------------------
@app.get("/health")
def health():
    return {"ok": True}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    clause_text = req.clause_text.strip()
    if not clause_text:
        raise HTTPException(status_code=400, detail="clause_text is empty")

    params = _parse_rag_params(req.rag_params)

    answer_raw = _invoke_chain(clause_text=clause_text, params=params)
    if not answer_raw:
        # LLM 호출은 성공했지만 빈 문자열 반환은 서버 품질 문제로 간주
        raise HTTPException(status_code=502, detail="empty answer from llm")

    # 기본 정책: JSON 파싱 실패해도 200 + raw 반환
    try:
        answer_json = json.loads(answer_raw)
        return AnalyzeResponse(
            ok=True,
            answer_raw=answer_raw,
            answer_json=answer_json,
            parse_error=False,
            error_message=None,
        )
    except Exception as e:
        if req.strict:
            # strict 모드: 기존처럼 실패 처리
            raise HTTPException(status_code=502, detail="LLM output is not valid JSON")

        return AnalyzeResponse(
            ok=True,
            answer_raw=answer_raw,
            answer_json=None,
            parse_error=True,
            error_message=f"json_parse_failed: {e!r}",
        )


# (선택) 디버그 전용: 기존 /analyze_raw 호환을 원하면 남겨두기
@app.post("/analyze_raw")
def analyze_raw(req: AnalyzeRequest):
    params = _parse_rag_params(req.rag_params)
    answer_raw = _invoke_chain(clause_text=req.clause_text.strip(), params=params)
    return {"answer_raw": answer_raw}
