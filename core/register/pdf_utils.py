from __future__ import annotations

from typing import List

from fastapi import HTTPException


def is_pdf(bytes_head: bytes) -> bool:
    return bytes_head[:4] == b"%PDF"


def pdf_to_images(file_bytes: bytes) -> List[bytes]:
    """PDF를 페이지별 PNG 바이트 리스트로 변환."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=file_bytes, filetype="pdf")
        images: List[bytes] = []
        for i in range(len(doc)):
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=150)
            images.append(pix.tobytes("png"))
        doc.close()
        return images
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF 처리 실패: {e!r}")

