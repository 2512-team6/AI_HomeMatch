# 01_groq_minimal.py
"""
Groq API 최소 연결 테스트
- prompt_templates에서 생성된 '완성된 프롬프트 문자열'을 그대로 넣어 호출
- LangChain 없이 Groq SDK 단독 사용
- 목적: API 연결 + 응답 정상 수신 확인
"""

from __future__ import annotations

import os
from dotenv import load_dotenv
from groq import Groq

# --------------------------------------------------
# 1. 환경 변수 로드
# --------------------------------------------------
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY 환경변수가 설정되지 않았습니다.")

# --------------------------------------------------
# 2. Groq Client 생성
# --------------------------------------------------
client = Groq(api_key=GROQ_API_KEY)

# --------------------------------------------------
# 3. 테스트용 프롬프트
#    (지금은 하드코딩, 다음 단계에서 prompt_templates 결과로 교체)
# --------------------------------------------------
test_prompt = """
너는 대한민국 임대차 법률 전문가다.

다음 특약 문구의 법적 문제점을 간단히 설명하라.

[특약]
임차인은 임대인의 사전 동의 없이 전대할 수 없다.
"""

# --------------------------------------------------
# 4. Groq LLM 호출
# --------------------------------------------------
response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[
        {
            "role": "system",
            "content": "You are a legal assistant specialized in Korean housing lease law.",
        },
        {"role": "user", "content": test_prompt},
    ],
    temperature=0.2,
    max_tokens=512,
)

# --------------------------------------------------
# 5. 결과 출력
# --------------------------------------------------
print("====== Groq Response ======")
print(response.choices[0].message.content)
print("===========================")
