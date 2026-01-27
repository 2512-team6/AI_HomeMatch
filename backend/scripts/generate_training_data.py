#!/usr/bin/env python3
"""
chatbot-guides.json 기반으로 OpenAI 파인튜닝용 training_data.jsonl 생성 스크립트

실행 위치 예시:
  cd backend/scripts
  python generate_training_data.py
"""

import json
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
GUIDE_PATH = ROOT / "src" / "main" / "resources" / "chatbot-guides.json"
OUTPUT_PATH = ROOT / "scripts" / "training_data.jsonl"


SYSTEM_PROMPT_BASE = (
    "너는 Home'Scan 부동산 임대차 관리 챗봇이다. "
    "Home'Scan 가이드 내용과 서비스 기능 설명만 근거로, 참고용으로만 안내해라. "
    "가이드 밖 내용(주식, 정치, 연예, 건강 등)에 대해서는 답변을 거절하고 "
    "Home'Scan이 다루는 범위(계약, 보증금, 등기부등본, 거주/퇴실 관리, 우리 화면/기능) 안에서만 도와줘야 한다."
)


def load_guides() -> dict:
    with open(GUIDE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_section(guides: dict, section_path: str):
    """예: 'moveout_management.deposit_management' 경로에 해당하는 dict 반환"""
    node = guides
    for part in section_path.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node


def format_section_to_answer(section: dict) -> str:
    """
    ChatbotService.formatGuideSectionToText 의 축약 버전.
    파인튜닝용 답변 텍스트로 사용.
    """
    if not isinstance(section, dict):
        return ""

    parts: list[str] = []

    title = section.get("title")
    if title:
        parts.append(title)

    desc = section.get("description")
    if desc:
        parts.append(desc)

    features = section.get("features")
    if isinstance(features, list) and features:
        feature_text = " / ".join(str(f) for f in features)
        parts.append(f"주요 기능으로는 {feature_text} 등이 있다.")

    tips = section.get("tips")
    if isinstance(tips, list) and tips:
        tips_text = " ".join(str(t) for t in tips)
        parts.append(f"가이드에서는 다음과 같이 참고하라고 안내한다: {tips_text}")

    items = section.get("items")
    if isinstance(items, list) and items:
        item_summaries = []
        for it in items:
            if isinstance(it, str):
                item_summaries.append(it)
            elif isinstance(it, dict):
                name = it.get("name") or ""
                desc = it.get("description") or ""
                timing = it.get("timing")
                text = name
                if desc:
                    text += f": {desc}"
                if timing:
                    text += f" (시기: {timing})"
                if text:
                    item_summaries.append(text)
        if item_summaries:
            parts.append("체크해야 할 항목 예시는 다음과 같다: " + " / ".join(item_summaries))

    # moveout_management.deposit_management.return_obligation 등 특수 구조 처리
    ro = section.get("return_obligation")
    if isinstance(ro, dict):
        if ro.get("description"):
            parts.append(ro["description"])
        if ro.get("reasonable_period"):
            parts.append(f"통상적으로는 {ro['reasonable_period']}로 안내된다.")
        if ro.get("note"):
            parts.append(ro["note"])

    return "\n".join(parts).strip()


def build_training_examples_from_suggested(guides: dict) -> list[dict]:
    """
    guides['suggested_questions'] 를 기반으로:
      - label 을 user 질문으로
      - section 경로에 해당하는 블록을 answer 로 포맷팅
    """
    result: list[dict] = []
    suggested = guides.get("suggested_questions") or {}

    for topic_key, items in suggested.items():
        if not isinstance(items, list):
            continue
        for entry in items:
            label = entry.get("label")
            section_path = entry.get("section")
            if not label or not section_path:
                continue

            section = get_section(guides, section_path)
            if not isinstance(section, dict):
                continue

            answer_body = format_section_to_answer(section)
            if not answer_body:
                continue

            # 답변 톤 약간 감싸기
            assistant_content = (
                f"가이드에서는 \"{label}\" 질문에 대해 대략 다음과 같이 안내하고 있어요.\n\n"
                f"{answer_body}\n\n"
                "(이 내용은 Home'Scan 가이드를 바탕으로 한 일반적인 참고 정보입니다. "
                "구체적인 상황은 전문가와 상의해 주세요.)"
            )

            example = {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT_BASE},
                    {"role": "user", "content": label},
                    {"role": "assistant", "content": assistant_content},
                ]
            }
            result.append(example)

    return result


def build_out_of_scope_examples() -> list[dict]:
    """도메인 밖 질문에 대한 거절 패턴"""
    base_sys = (
        "너는 Home'Scan 부동산 임대차 관리 챗봇이다. "
        "부동산 임대차, 계약서, 등기부등본, 거주/퇴실 관리, Home'Scan 서비스 사용법에 대해서만 답변해라. "
        "그 외 주제(주식, 코인, 연애, 연예인, 정치, 일반 금융 등)는 반드시 정중하게 범위 밖이라고 답해라."
    )

    pairs = [
        ("주식 어떤 거 사야 해요?",),
        ("비트코인 전망이 어떤가요?",),
        ("연예인 스캔들 알려 주세요.",),
        ("건강검진은 얼마나 자주 받아야 하나요?",),
    ]

    examples: list[dict] = []
    for (question,) in pairs:
        assistant = (
            "이 질문은 Home'Scan 가이드와 직접 관련된 주제가 아니라서, 제가 정확하게 안내해 드리기 어려워요. "
            "저는 집을 구하거나 계약하고, 거주하고, 퇴실하는 과정에서 발생하는 임대차·등기부등본·보증금·하자 관리 같은 내용만 도와드릴 수 있어요."
        )
        examples.append(
            {
                "messages": [
                    {"role": "system", "content": base_sys},
                    {"role": "user", "content": question},
                    {"role": "assistant", "content": assistant},
                ]
            }
        )

    return examples


def main():
    print(f"[INFO] 가이드 파일: {GUIDE_PATH}")
    guides = load_guides()

    examples: list[dict] = []

    # 1) 가이드 기반 Q&A (추천 질문 기준)
    examples.extend(build_training_examples_from_suggested(guides))

    # 2) 범위 밖 질문 예시
    examples.extend(build_out_of_scope_examples())

    # JSONL로 저장
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        for ex in examples:
            f.write(json.dumps(ex, ensure_ascii=False) + "\n")

    print(f"[INFO] {len(examples)}개의 학습 예시를 {OUTPUT_PATH} 에 저장했습니다.")
    print()
    print("다음 단계:")
    print("1) OpenAI에 파일 업로드:")
    print("   curl https://api.openai.com/v1/files \\")
    print("     -H \"Authorization: Bearer $OPENAI_API_KEY\" \\")
    print("     -F \"purpose=fine-tune\" \\")
    print("     -F \"file=@training_data.jsonl\"")
    print()
    print("2) 업로드 응답에서 file-xxx ID를 확인한 뒤 파인튜닝 job 생성:")
    print("   curl https://api.openai.com/v1/fine_tuning/jobs \\")
    print("     -H \"Content-Type: application/json\" \\")
    print("     -H \"Authorization: Bearer $OPENAI_API_KEY\" \\")
    print("     -d '{")
    print("       \"training_file\": \"file-xxx\",")
    print("       \"model\": \"gpt-4o-mini\"")
    print("     }'")
    print()
    print("3) 파인튜닝이 완료되면 응답에 나오는 모델 ID(ft:gpt-4o-mini:...)를")
    print("   backend/.env 파일에 OPENAI_FINETUNED_MODEL_ID 로 설정하면 됩니다.")


if __name__ == "__main__":
    main()

