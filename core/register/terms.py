from __future__ import annotations

import re
from typing import Dict, List, Pattern, Tuple

_REGEX_REPLACEMENTS: List[Tuple[Pattern[str], str]] = [
    (re.compile(r"소\s*재\s*지", re.IGNORECASE), "소재지"),
    (re.compile(r"면\s*적", re.IGNORECASE), "면적"),
    (re.compile(r"m2|m²", re.IGNORECASE), "㎡"),
]

_TYPO_TO_CANONICAL: Dict[str, str] = {
    "표게부": "표제부",
    "표계부": "표제부",
    "표재부": "표제부",
    "표개부": "표제부",
}


def correct_with_vocab(text: str) -> str:
    if not text or not text.strip():
        return ""
    out = text
    for pattern, repl in _REGEX_REPLACEMENTS:
        out = pattern.sub(repl, out)
    tokens = out.split()
    corrected = [_TYPO_TO_CANONICAL.get(t, t) for t in tokens]
    return " ".join(corrected)

