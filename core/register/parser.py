from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

_KOREAN_NAME_RE = re.compile(r"^[가-힣·]{2,10}$")


def _parse_date(text: str) -> Optional[str]:
    m = re.search(r"(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})", text)
    if m:
        y, mo, d = m.group(1), int(m.group(2)), int(m.group(3))
        return f"{y}-{mo:02d}-{d:02d}"
    m = re.search(r"(\d{4})\s*년\s*(\d{1,2})\s*(?:월|원)\s*(\d{1,2})\s*일", text)
    if m:
        y, mo, d = m.group(1), int(m.group(2)), int(m.group(3))
        return f"{y}-{mo:02d}-{d:02d}"
    return None


def _extract_owner_names(line: str) -> List[str]:
    names: List[str] = []
    for m in re.finditer(r"소유자\s*[:：]?\s*([^\s\d]{2,20})", line):
        candidate = (m.group(1) or "").strip()
        candidate = re.split(r"[()\[\],]|외|및", candidate)[0].strip()
        if candidate and _KOREAN_NAME_RE.match(candidate):
            names.append(candidate)
    out: List[str] = []
    seen = set()
    for n in names:
        if n not in seen:
            seen.add(n)
            out.append(n)
    return out


def parse_registry_text(text: str) -> Dict[str, Any]:
    if not text or not text.strip():
        return {
            "property_info": {"address": None, "building_name": None, "dong": None, "ho": None, "area_m2": None},
            "owners": [],
            "ownership_changes": [],
            "rights": [],
        }

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    out: Dict[str, Any] = {
        "property_info": {"address": None, "building_name": None, "dong": None, "ho": None, "area_m2": None},
        "owners": [],
        "ownership_changes": [],
        "rights": [],
    }

    for line in lines:
        # 주소
        if out["property_info"]["address"] is None:
            if "도로명주소" in line or "[도로명주소]" in line:
                m = re.search(r"(?:도로명주소\]?\s*)(.+)", line)
                if m:
                    addr_part = m.group(1).strip()
                    addr_part = re.split(r"(면적|대지권|표시번호|\d+\s*층)", addr_part)[0].strip()
                    if addr_part:
                        out["property_info"]["address"] = addr_part
            if out["property_info"]["address"] is None and ("소재지" in line or "주소" in line):
                m = re.search(r"(소재지(?!번)|주소)\s*[:：]?\s*(.+)", line)
                if m:
                    addr_part = m.group(2)
                    addr_part = re.split(r"(건물명|면적|갑구|을구)", addr_part)[0].strip()
                    out["property_info"]["address"] = addr_part or None

        # 건물명
        if "건물명" in line and out["property_info"]["building_name"] is None:
            m = re.search(r"건물명\s*[:：]?\s*(.+)", line)
            if m:
                name_part = m.group(1)
                name_part = re.split(r"\d+\s*동|\d+\s*호|면적|㎡", name_part)[0].strip()
                out["property_info"]["building_name"] = name_part or None

        # 면적
        if "면적" in line and out["property_info"]["area_m2"] is None:
            m = re.search(r"(\d+\.?\d*)\s*㎡", line)
            if m:
                out["property_info"]["area_m2"] = m.group(1) + " ㎡"

        # 동/호(소유자/권리자 주소에서 잘못 잡히는 경우 제외)
        if (
            ("동" in line and "호" in line)
            and out["property_info"]["dong"] is None
            and ("소유자" not in line and "채무자" not in line and "권리자" not in line)
        ):
            m = re.search(r"(\d+)\s*동\s*(\d+)\s*호", line)
            if m:
                out["property_info"]["dong"] = m.group(1)
                out["property_info"]["ho"] = m.group(2)

        # 집합건물 호수(제303호)
        if out["property_info"]["ho"] is None:
            m = re.search(r"제\s*(\d+)\s*호", line)
            if m and ("[집합건물]" in line or "전유" in line or "표제부" in line or "건물" in line):
                out["property_info"]["ho"] = m.group(1)

        # 소유자(여러 번 등장 가능)
        if "소유자" in line:
            for name in _extract_owner_names(line):
                out["owners"].append({"name": name, "ownership_type": "단독", "share": None})

        # 소유권이전(여러 번 등장 가능)
        if "소유권" in line and "이전" in line:
            for m in re.finditer(r"소유권\s*이전", line):
                tail = line[m.end() : m.end() + 80]
                out["ownership_changes"].append(
                    {"date": _parse_date(tail), "reason": "소유권이전", "details": line}
                )

        # 권리(단순)
        if "근저당" in line or "저당권" in line or "전세권" in line:
            out["rights"].append({"section": "을구", "right_type": line[:80], "details": line})

    return out


def split_registry_sections(text: str) -> Dict[str, str]:
    if not text or not text.strip():
        return {"pyojebu": "", "gapgu": "", "eulgu": ""}
    lines = text.splitlines()
    pyojebu: List[str] = []
    gapgu: List[str] = []
    eulgu: List[str] = []
    current = "pyojebu"
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if "표제부" in stripped:
            current = "pyojebu"
            pyojebu.append(stripped)
        elif "갑구" in stripped:
            current = "gapgu"
            gapgu.append(stripped)
        elif "을구" in stripped:
            current = "eulgu"
            eulgu.append(stripped)
        else:
            if current == "pyojebu":
                pyojebu.append(stripped)
            elif current == "gapgu":
                gapgu.append(stripped)
            else:
                eulgu.append(stripped)
    return {
        "pyojebu": "\n".join(pyojebu) if pyojebu else text[:2000],
        "gapgu": "\n".join(gapgu) if gapgu else "",
        "eulgu": "\n".join(eulgu) if eulgu else "",
    }

