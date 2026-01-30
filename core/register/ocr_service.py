from __future__ import annotations

import io
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException

from .terms import correct_with_vocab

_easyocr_reader = None


def _patch_pillow_antialias() -> None:
    """Pillow 10+에서 제거된 Image.ANTIALIAS를 EasyOCR 호환으로 보완."""
    try:
        from PIL import Image

        if not hasattr(Image, "ANTIALIAS"):
            try:
                Image.ANTIALIAS = Image.Resampling.LANCZOS  # type: ignore[attr-defined]
            except Exception:
                pass
    except Exception:
        pass


def _get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr  # noqa

        _easyocr_reader = easyocr.Reader(["ko", "en"], gpu=False)
    return _easyocr_reader


def extract_text(image_bytes: bytes) -> str:
    """이미지 바이트에서 OCR 텍스트 추출(샘플 없음, 실패 시 500)."""
    _patch_pillow_antialias()
    try:
        from PIL import Image
        import numpy as np

        reader = _get_easyocr_reader()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr = np.array(img)
        results = reader.readtext(arr)
        lines = [item[1] for item in results]
        raw = "\n".join(lines) if lines else ""
        return correct_with_vocab(raw)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 실패: {e!r}")


def get_detection_regions(image_bytes: bytes) -> Tuple[List[Dict[str, Any]], Optional[bytes]]:
    """OCR 박스/텍스트/신뢰도 반환 (bbox는 JSON 직렬화 가능하도록 float로 변환)."""
    _patch_pillow_antialias()
    try:
        from PIL import Image
        import numpy as np

        reader = _get_easyocr_reader()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr = np.array(img)
        results = reader.readtext(arr)
        regions: List[Dict[str, Any]] = []
        for (bbox, text, conf) in results:
            converted_bbox = [[float(c) for c in pt] for pt in bbox]
            regions.append(
                {
                    "bbox": converted_bbox,
                    "text": correct_with_vocab(text),
                    "confidence": round(float(conf), 4),
                }
            )
        return regions, image_bytes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 영역 추출 실패: {e!r}")

