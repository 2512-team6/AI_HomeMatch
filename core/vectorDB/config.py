from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class DBConfig:
    host: str
    port: int
    user: str
    password: str
    database: str


@dataclass(frozen=True)
class RAGConfig:
    chroma_dir: Path = Path("chroma_store")
    collection_name: str = "mediation_cases"
    chunk_size: int = 900
    chunk_overlap: int = 150

    top_k: int = 4

    embedding_model_name: str = (
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )


SECTION_FIELDS = [
    "facts",
    "issues",
    "related_rules",
    "related_precedents",
    "result",
    "order_text",
]


def load_db_config() -> DBConfig:
    return DBConfig(
        host=os.environ["DB_HOST"],
        port=int(os.environ.get("DB_PORT")),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
    )


RAG = RAGConfig()
