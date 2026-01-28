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
    model: str = "llama-3.3-70b-versatile"
    temperature: float = 0.1

    # ✅ JSON 안정성: 출력 토큰 여유를 충분히
    max_tokens: int = 1600

    # 입력 하드컷(필요시 retry에서 단계적으로 줄임)
    user_max_chars: int = 9000

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
        TPM/413류 에러가 나면 입력(user_max_chars)만 줄여 재시도.
        ✅ 출력(max_tokens)은 가능한 유지해서 JSON이 중간에 끊기는 문제를 줄인다.
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

                if attempt < cfg.retry:
                    # ✅ 입력만 줄이자(출력 토큰은 유지)
                    user_max_chars = max(5000, int(user_max_chars * 0.75))
                    time.sleep(cfg.retry_sleep_sec)
                    continue

                raise

        raise last_err or RuntimeError("Unknown Groq client error")
