# config.py
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Literal, Optional

from dotenv import load_dotenv

load_dotenv()

DataKind = Literal["law", "precedent", "mediation"]


# -----------------------------
# DB Config
# -----------------------------
@dataclass(frozen=True)
class DBConfig:
    host: str
    port: int
    user: str
    password: str
    database: str


def load_db_config() -> DBConfig:
    return DBConfig(
        host=os.environ["DB_HOST"],
        port=int(os.environ.get("DB_PORT", "3306")),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
    )


# -----------------------------
# Observability (LangSmith / LangChain)
# -----------------------------
@dataclass(frozen=True)
class ObservabilityConfig:
    enabled: bool = True
    project: str = (
        os.environ.get("LANGCHAIN_PROJECT")
        or os.environ.get("LANGSMITH_PROJECT")
        or "HomeScan"
    )
    endpoint: str = (
        os.environ.get("LANGCHAIN_ENDPOINT")
        or os.environ.get("LANGSMITH_ENDPOINT")
        or "https://api.smith.langchain.com"
    )


# -----------------------------
# RAG Config
# -----------------------------
@dataclass(frozen=True)
class DatasetConfig:
    """
    각 데이터셋(법령/판례/분쟁조정사례)에서
    - 어떤 컬럼들을 가져와서
    - 어떤 순서로 하나의 텍스트로 합쳐서
    - 벡터DB에 넣을지 정의
    """

    table_name: str
    collection_name: str
    text_fields: List[str]
    metadata_fields: List[str]
    field_max_chars: Optional[Dict[str, int]] = None


@dataclass(frozen=True)
class RAGConfig:
    # Storage
    chroma_dir: Path = Path("chroma_store")

    # Chunking (현 chunking.py가 공통값만 쓰므로, 여기서는 공통값을 "안전하게" 조정)
    # - 법령 조문은 짧은 편이라 지나치게 큰 chunk_size가 필요 없음
    # - 분쟁조정사례/판례(headnote)는 문단 길이가 길어질 수 있어 과도한 chunk_size는 품질 저하 가능
    chunk_size: int = 1200
    chunk_overlap: int = 150

    # Retrieval
    top_k: int = 4

    # Embedding model
    embedding_model_name: str = "BAAI/bge-m3"

    # 데이터셋별 설정
    datasets: Dict[DataKind, DatasetConfig] = None  # type: ignore


# -----------------------------
# Precedent vectorization modes
# -----------------------------
PRECEDENT_VECTOR_MODE = os.environ.get("PRECEDENT_VECTOR_MODE", "headnote")
# headnote: 1차 후보 검색용(기본)
# fulltext: (나중에) 특정 판례 전문만 벡터화/정밀 검색용


def _default_rag_config() -> RAGConfig:
    # -------------------------
    # 판례 필드 세트 분리
    # -------------------------
    # headnote 계열 텍스트는 <br/> 등 HTML이 섞이는 경우가 많고 길이도 케이스마다 편차가 큼.
    # "너무 긴 1개 문서"가 생기지 않도록 필드별 clip을 기본으로 둠.
    precedent_headnote = DatasetConfig(
        table_name="precedents",
        collection_name="precedent_cases_headnote",
        text_fields=[
            "case_name",
            "case_number",
            "issues",  # 판시사항
            "summary",  # 판결요지
            "referenced_laws",  # 참조조문
            "referenced_cases",  # 참조판례
        ],
        metadata_fields=[
            "precedent_id",
            "decision_date",
            "decision_type",
            "court_name",
            "case_type_name",
            "judgment_type",
            "case_number",
            "case_name",
        ],
        field_max_chars={
            "issues": 6000,
            "summary": 8000,
            "referenced_laws": 4000,
            "referenced_cases": 3000,
        },
    )

    precedent_fulltext = DatasetConfig(
        table_name="precedents",
        collection_name="precedent_cases_fulltext",
        text_fields=[
            "case_name",
            "case_number",
            "full_text",
        ],
        metadata_fields=precedent_headnote.metadata_fields,
        # 전문은 매우 길어질 수 있으니 "임베딩 입력 폭발" 방지용 clip
        field_max_chars={"full_text": 24000},
    )

    selected_precedent = (
        precedent_fulltext
        if PRECEDENT_VECTOR_MODE == "fulltext"
        else precedent_headnote
    )

    return RAGConfig(
        datasets={
            # -------------------------
            # 분쟁조정사례: mediation_cases
            # -------------------------
            # 실제 데이터에서 related_rules/order_text가 길어지기 쉬움.
            # "한 케이스가 지나치게 비대해지는 것"을 방지하기 위해 필드별 clip을 기본으로 둠.
            "mediation": DatasetConfig(
                table_name="mediation_cases",
                collection_name="mediation_cases",
                text_fields=[
                    "title",
                    "facts",
                    "issues",
                    "related_rules",
                    "related_precedents",
                    "result",
                    "order_text",
                ],
                metadata_fields=[
                    "case_id",
                    "source_year",
                    "source_name",
                    "source_doc",
                    "page_start",
                    "page_end",
                    "title",
                ],
                field_max_chars={
                    "facts": 6000,
                    "issues": 3000,
                    "related_rules": 8000,
                    "related_precedents": 3000,
                    "result": 2500,
                    "order_text": 9000,
                },
            ),
            # -------------------------
            # 법령: law_text
            # -------------------------
            # row가 조문 단위로 이미 잘게 분리되어 있어 text는 길지 않은 편.
            # source_name은 모든 row에서 반복될 가능성이 높아 "텍스트 유사도"를 불필요하게 끌어올릴 수 있어
            # 본문(text_fields)에서는 제외하고 메타로만 유지(검색은 title/text 중심).
            "law": DatasetConfig(
                table_name="law_text",
                collection_name="housing_lease_law",
                text_fields=[
                    "title",  # 제X조(…)
                    "text",  # 조문 본문
                ],
                metadata_fields=[
                    "id",
                    "source_year",
                    "source_name",
                    "source_doc",
                    "page_start",
                    "page_end",
                    "title",
                ],
                field_max_chars={
                    "text": 6000,
                },
            ),
            # -------------------------
            # 판례: precedents (기본: headnote)
            # -------------------------
            "precedent": selected_precedent,
        }
    )


RAG = _default_rag_config()
OBS = ObservabilityConfig()
