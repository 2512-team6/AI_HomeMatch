from __future__ import annotations

import os
from typing import Any, Dict, List


def build_risk_flags(structured: Dict[str, Any]) -> List[str]:
    flags: List[str] = []
    prop = structured.get("property_info") or {}
    owners = structured.get("owners") or []
    rights = structured.get("rights") or []
    changes = structured.get("ownership_changes") or []

    owner_names = [o.get("name") for o in owners if o.get("name")]
    owner_names_unique: List[str] = []
    seen = set()
    for n in owner_names:
        if n not in seen:
            seen.add(n)
            owner_names_unique.append(n)

    has_explicit_joint = any((o.get("ownership_type") or "").strip() == "공동" for o in owners)
    has_share = any(o.get("share") for o in owners)

    if (has_explicit_joint or has_share) and len(owner_names_unique) >= 2:
        flags.append("여러 명이 함께 소유하는 것으로 보입니다(공동 소유 가능성).")
    elif len(owner_names_unique) >= 2 and changes:
        flags.append("소유자가 변경된 기록이 있습니다(이전/현재 소유자가 함께 추출될 수 있음).")

    if len(rights) > 0:
        flags.append(f"등기부에 {len(rights)}건의 권리(근저당·전세권 등)가 등재되어 있습니다.")
    if changes:
        flags.append("소유권 이전 이력이 있습니다. 시점 확인이 필요할 수 있습니다.")
    if not (prop.get("address") or prop.get("dong") or prop.get("ho")):
        flags.append("주소·동호 정보가 추출되지 않았습니다. 목적물 특정 확인이 필요합니다.")
    if not flags:
        flags.append("추출된 정보 기준으로 특별한 위험 신호는 없습니다. 추가 확인을 권장합니다.")
    return flags


def build_check_items(structured: Dict[str, Any]) -> List[Dict[str, Any]]:
    prop = structured.get("property_info") or {}
    owners = structured.get("owners") or []
    rights = structured.get("rights") or []
    changes = structured.get("ownership_changes") or []

    items: List[Dict[str, Any]] = []

    owner_names = [o.get("name", "").strip() for o in owners if o.get("name")]
    owner_names_unique: List[str] = []
    seen = set()
    for n in owner_names:
        if n and n not in seen:
            seen.add(n)
            owner_names_unique.append(n)

    # 1) 소유자
    if owner_names_unique:
        current_owner = owner_names_unique[-1]
        previous_owners = owner_names_unique[:-1]
        if previous_owners:
            items.append(
                {
                    "status": "caution",
                    "summary": f"현재 소유자로 보이는 이름: {current_owner}. 이전 소유자 이름도 함께 추출되었습니다: {', '.join(previous_owners)}. 계약 상대방 이름이 현재 소유자와 같은지 확인하세요. (신원 진위는 등기부만으로는 확인 불가)",
                }
            )
        else:
            items.append(
                {
                    "status": "ok",
                    "summary": f"등기부상 소유자: {current_owner}. 계약 상대방 이름과 일치 여부를 확인하세요. (신원 진위는 등기부만으로는 확인 불가)",
                }
            )
    else:
        items.append({"status": "pending", "summary": "소유자 정보가 추출되지 않았습니다. 등기부를 다시 확인하세요."})

    # 2) 근저당/권리
    if len(rights) > 0:
        items.append(
            {
                "status": "caution",
                "summary": f"등기부에 {len(rights)}건의 권리(근저당·전세권 등)가 등재되어 있습니다. 보증금보다 먼저 변제받을 권리가 있을 수 있으니 설정 시점과 금액을 확인하세요.",
            }
        )
    else:
        items.append({"status": "ok", "summary": "등기부에 근저당·가압류 등 권리가 등재되어 있지 않은 것으로 보입니다."})

    # 3) 소유권 이전 시점
    if changes:
        dated = [c for c in changes if c.get("date")]
        if dated:
            items.append({"status": "caution", "summary": f"소유권 이전 이력이 있습니다. 최근 확인된 이전일: {dated[0].get('date')}."})
        else:
            items.append({"status": "ok", "summary": "소유권 이전 이력이 있으나 날짜가 명확히 추출되지 않았습니다. 원문을 확인하세요."})
    else:
        items.append({"status": "ok", "summary": "최근 소유권 이전 이력이 추출되지 않았습니다."})

    # 4) 공동 소유 여부
    has_explicit_joint = any((o.get("ownership_type") or "").strip() == "공동" for o in owners)
    has_share = any(o.get("share") for o in owners)
    if has_explicit_joint or has_share:
        items.append({"status": "caution", "summary": "여러 명이 함께 소유(공동 소유)하는 것으로 보입니다. 계약 전에 모든 소유자의 동의/서명 여부를 확인하세요."})
    elif len(owner_names_unique) >= 2 and changes:
        items.append({"status": "ok", "summary": "소유자 이름이 2명 이상 추출되었지만 소유권 이전(과거/현재) 때문일 수 있습니다. 공동 소유로 단정하지 말고 지분/공유 표기를 확인하세요."})
    else:
        items.append({"status": "ok", "summary": "단독 소유로 보입니다. 다만 등기부 원문에서 확인하세요."})

    # 5) 선순위 권리 구조
    if len(rights) > 0:
        items.append({"status": "caution", "summary": f"권리 {len(rights)}건이 있어 선순위 구조 확인이 필요합니다. 설정 순서/금액을 확인하세요."})
    else:
        items.append({"status": "ok", "summary": "선순위 권리가 뚜렷하게 추출되지 않았습니다."})

    # 6) 목적물 특정
    addr = prop.get("address") or ""
    dong = prop.get("dong") or ""
    ho = prop.get("ho") or ""
    if addr or (dong and ho):
        addr_str = addr or f"{dong}동 {ho}호"
        items.append({"status": "ok", "summary": f"등기부상 주소·동호: {addr_str}. 계약서 정보와 일치하는지 확인하세요."})
    else:
        items.append({"status": "pending", "summary": "주소·동호 정보가 추출되지 않았습니다. 원문 확인이 필요합니다."})

    return items


def explain_risk(structured: Dict[str, Any], risk_flags: List[str]) -> str:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return "\n\n".join(f"{i+1}. {f}\n(추가 확인을 권장합니다.)" for i, f in enumerate(risk_flags))

    try:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        risk_text = "\n".join(f"{i+1}. {f}" for i, f in enumerate(risk_flags))
        user_content = (
            "다음은 등기부 분석 시스템이 탐지한 위험 신호 목록입니다.\n\n"
            f"{risk_text}\n\n"
            "어려운 법률 용어를 사용하지 말고, 중학생도 이해할 수 있는 쉬운 말로 설명하세요.\n"
            "각 항목은 다음 구조로 작성하세요:\n"
            "1. 한 줄 요약\n2. 무슨 뜻인지 쉬운 설명\n3. 왜 주의해야 하는지\n4. 사용자가 추가로 확인하면 좋은 것\n"
        )
        resp = client.chat.completions.create(
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "당신은 부동산 등기부 정보를 쉽게 설명하는 안내 AI입니다. 법적 판단은 하지 마세요."},
                {"role": "user", "content": user_content},
            ],
            max_tokens=1200,
        )
        return (resp.choices[0].message.content or "").strip()
    except Exception:
        return "\n\n".join(f"{i+1}. {f}\n(추가 확인을 권장합니다.)" for i, f in enumerate(risk_flags))

