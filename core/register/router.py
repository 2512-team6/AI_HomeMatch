from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from .ocr_service import extract_text
from .parser import parse_registry_text, split_registry_sections
from .pdf_utils import is_pdf, pdf_to_images
from .risk_analysis import build_check_items, build_risk_flags, explain_risk
from .storage import get_document, save_document, update_document

router = APIRouter()


class SectionUpdate(BaseModel):
    pyojebu: Optional[str] = None
    gapgu: Optional[str] = None
    eulgu: Optional[str] = None


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    preprocess: str = Form("none"),  # reserved (호환용)
    use_llm_correction: str = Form("false"),  # reserved (호환용)
):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="파일이 비어 있습니다.")

    if is_pdf(raw):
        images = pdf_to_images(raw)
        all_texts: List[str] = []
        for img_bytes in images:
            all_texts.append(extract_text(img_bytes))
        extracted_text = "\n\n--- 페이지 구분 ---\n\n".join(all_texts)
    else:
        extracted_text = extract_text(raw)

    structured = parse_registry_text(extracted_text)
    sections = split_registry_sections(extracted_text)
    doc_id = save_document(extracted_text=extracted_text, parsed_data=structured, sections=sections)

    return {
        "document_id": doc_id,
        "extracted_text": extracted_text,
        "parsed_data": structured,
        "sections": sections,
    }


@router.get("/documents/{document_id}")
async def get_doc(document_id: int):
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    return doc


@router.post("/documents/{document_id}/sections")
async def update_sections(document_id: int, body: SectionUpdate):
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    sec = doc.get("sections") or {}
    parts = [
        body.pyojebu if body.pyojebu is not None else sec.get("pyojebu", ""),
        body.gapgu if body.gapgu is not None else sec.get("gapgu", ""),
        body.eulgu if body.eulgu is not None else sec.get("eulgu", ""),
    ]
    new_text = "\n\n".join(parts)
    structured = parse_registry_text(new_text)
    sections = {"pyojebu": parts[0], "gapgu": parts[1], "eulgu": parts[2]}
    update_document(document_id, extracted_text=new_text, parsed_data=structured, sections=sections)
    doc = get_document(document_id) or {}
    return {
        "document_id": document_id,
        "extracted_text": doc.get("extracted_text"),
        "parsed_data": doc.get("parsed_data"),
        "sections": doc.get("sections"),
    }


@router.post("/documents/{document_id}/risk-analysis")
async def risk_analysis(document_id: int):
    doc = get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    text = doc.get("extracted_text") or ""
    structured = parse_registry_text(text)
    update_document(document_id, parsed_data=structured)

    risk_flags = build_risk_flags(structured)
    explanation = explain_risk(structured, risk_flags)
    check_items = build_check_items(structured)

    return {
        "success": True,
        "document_id": document_id,
        "structured": structured,
        "risk_flags": risk_flags,
        "explanation": explanation,
        "check_items": check_items,
    }

