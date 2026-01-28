# api_server.py
from __future__ import annotations

import json
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from langchain_step_names import build_chain, RagParams
from llm_client_groq import GroqLLMClient, GroqLLMConfig

app = FastAPI(title="AI_HomeMatch RAG API")

chain = build_chain()

# 서버 시작 시 1회 생성 (매 요청마다 생성하지 않음)
llm = GroqLLMClient(
    cfg=GroqLLMConfig(
        model="llama-3.3-70b-versatile",
        temperature=0.1,
        max_tokens=1600,
        user_max_chars=9000,
        retry=2,
    )
)


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


def _parse_rag_params(rag_params: Optional[Dict[str, Any]]) -> RagParams:
    try:
        return RagParams(**rag_params) if rag_params else RagParams()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid rag_params: {e!r}")


def _invoke_chain(*, clause_text: str, params: RagParams) -> str:
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
