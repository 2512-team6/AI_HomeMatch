# test_api_call.py
from __future__ import annotations

import json
import requests

API_URL = "http://127.0.0.1:8000/analyze"

REQUIRED_KEYS = [
    "level",
    "color",
    "conclusion",
    "risk_points",
    "mediation_cases",
    "mediation_case_ids",
    "precedents",
    "precedent_ids",
    "laws",
    "law_ids",
    "recommendations",
]


def main() -> None:
    clause_text = (
        """누수, 단전, 단수로 발생한 손해는 모두 임차인 책임으로 한다.""".strip()
    )
    # 누수, 단전, 단수로 발생한 손해는 모두 임차인 책임으로 한다.
    # 임차인은 가족 외 제3자를 거주하게 할 수 없다.
    # 임차인은 매월 약정한 기일에 차임을 지급하여야 한다
    # 임차인이 차임을 2기 이상 연체한 경우, 임대인은 별도의 최고 없이 계약을 해지할 수 있다.
    payload = {
        "clause_text": clause_text,
        "rag_params": None,
        "strict": False,  # ✅ 파싱 실패해도 200 유지
        "debug": False,
    }

    resp = requests.post(API_URL, json=payload, timeout=120)
    print("[HTTP STATUS]", resp.status_code)

    if resp.status_code != 200:
        print("[FAIL] non-200 response")
        return

    # 1) API 응답 JSON 파싱
    try:
        data = resp.json()
    except Exception:
        print("[FAIL] response is not valid JSON")
        print("----- RAW -----")
        print(resp.text)
        return

    # 2) API 레벨 parse_error 확인
    parse_error = bool(data.get("parse_error", False))
    if parse_error:
        print("[WARN] parse_error=true")
        print("[error_message]", data.get("error_message"))
        print("\n[answer_raw]\n", data.get("answer_raw", ""))
        return

    # 3) answer_json 검증
    answer_json = data.get("answer_json")
    if not isinstance(answer_json, dict):
        print("[FAIL] answer_json is missing or not a dict")
        print("----- FULL RESPONSE -----")
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return

    for k in REQUIRED_KEYS:
        if k not in answer_json:
            print(f"[WARN] missing key in answer_json: {k}")

    print("\n[OK] API parsed JSON response (answer_json)\n")
    print(json.dumps(answer_json, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
