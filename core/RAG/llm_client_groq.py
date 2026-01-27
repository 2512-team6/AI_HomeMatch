# 03_llm_client_groq.py
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Dict, List, Optional

from dotenv import load_dotenv
from groq import Groq


@dataclass(frozen=True)
class GroqLLMConfig:
    model: str = "llama-3.1-8b-instant"
    temperature: float = 0.1
    max_tokens: int = 768  # 기본은 512
    user_max_chars: int = 9000  # TPM 회피용 하드 컷
    retry: int = 2
    retry_sleep_sec: float = 1.0


class GroqLLMClient:
    def __init__(
        self, *, api_key: Optional[str] = None, cfg: Optional[GroqLLMConfig] = None
    ):
        load_dotenv()
        key = api_key or os.getenv("GROQ_API_KEY")
        if not key:
            raise RuntimeError("GROQ_API_KEY 환경변수가 설정되지 않았습니다.")
        self.client = Groq(api_key=key)
        self.cfg = cfg or GroqLLMConfig()

    def _shrink_messages(
        self, messages: List[Dict[str, str]], *, user_max_chars: int
    ) -> List[Dict[str, str]]:
        out: List[Dict[str, str]] = []
        for m in messages:
            if m["role"] == "user":
                c = m["content"]
                if len(c) > user_max_chars:
                    c = c[:user_max_chars] + "\n\n[...생략: prompt size truncated...]"
                out.append({"role": "user", "content": c})
            else:
                out.append(m)
        return out

    def generate(self, messages: List[Dict[str, str]]) -> str:
        """
        messages(OpenAI/Groq 스타일)를 받아 문자열 답변을 반환.
        TPM/413류 에러가 나면 max_tokens / user_max_chars를 줄여 재시도.
        """
        cfg = self.cfg
        max_tokens = cfg.max_tokens
        user_max_chars = cfg.user_max_chars

        last_err: Optional[Exception] = None

        for attempt in range(cfg.retry + 1):
            try:
                msgs = self._shrink_messages(messages, user_max_chars=user_max_chars)

                resp = self.client.chat.completions.create(
                    model=cfg.model,
                    messages=msgs,
                    temperature=cfg.temperature,
                    max_tokens=max_tokens,
                )
                return resp.choices[0].message.content or ""

            except Exception as e:
                last_err = e

                # 가장 흔한 케이스: 413 / TPM
                # → 출력 토큰과 입력 길이를 단계적으로 줄여서 재시도
                if attempt < cfg.retry:
                    max_tokens = max(
                        256, int(max_tokens * 0.7)
                    )  # 512 -> 358 -> 250(최소 256)
                    user_max_chars = max(
                        6000, int(user_max_chars * 0.8)
                    )  # 9000 -> 7200 -> 5760(최소 6000)
                    time.sleep(cfg.retry_sleep_sec)
                    continue

                raise

        # 여긴 사실상 도달 안 함
        raise last_err or RuntimeError("Unknown Groq client error")
