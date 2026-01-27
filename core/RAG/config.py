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
    """
    - LangChain 기반 트레이싱을 사용할 예정이므로 .env에서는 보통 아래 키 조합을 권장:
      LANGCHAIN_TRACING_V2=true
      LANGCHAIN_API_KEY=...
      LANGCHAIN_PROJECT=...
      LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
    """

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

    # MariaDB table name
    table_name: str

    # Chroma collection name
    collection_name: str

    # 텍스트로 합칠 컬럼 목록(순서 중요)
    text_fields: List[str]

    # 메타데이터로 넣을 컬럼 목록(문서 추적/필터링용)
    metadata_fields: List[str]

    # 너무 긴 필드가 있으면 앞부분만 잘라서 넣고 싶을 때(선택)
    # 예: {"full_text": 12000, "text": 12000}
    field_max_chars: Optional[Dict[str, int]] = None


@dataclass(frozen=True)
class RAGConfig:
    # Storage
    chroma_dir: Path = Path("chroma_store")

    # Chunking (LangChain TextSplitter에 그대로 사용)
    chunk_size: int = 2000
    chunk_overlap: int = 200

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
            # "full_text"  # ❌ 1차 벡터화에서는 제외
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
        # headnote는 보통 길이가 과하지 않지만, 필요하면 제한 가능
        # field_max_chars={"summary": 12000, "issues": 12000},
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
        # 전문이 매우 길어질 수 있으니 현실적으로 제한 두는 경우가 많음
        field_max_chars={"full_text": 30000},
    )

    # 기본 precedent dataset은 "headnote"로 고정
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
            ),
            # -------------------------
            # 법령: law_text
            # -------------------------
            "law": DatasetConfig(
                table_name="law_text",
                collection_name="housing_lease_law",
                text_fields=[
                    "source_name",  # 법령명
                    "title",  # 조문 범위/제목
                    "text",  # 본문
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
            ),
            # -------------------------
            # 판례: precedents (기본: headnote)
            # -------------------------
            "precedent": selected_precedent,
        }
    )


RAG = _default_rag_config()
OBS = ObservabilityConfig()
