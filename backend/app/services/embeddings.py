"""Single source of truth for the embedding model.

`intfloat/multilingual-e5-small` runs fully offline, covers ~100 languages
including Hindi, Urdu, Bengali, Tamil, Telugu, Marathi and most other NCERT
languages, and outputs 384-dim vectors. E5 models need a "passage: " prefix
on documents and a "query: " prefix on queries.

Ingestion and retrieval must use the same model, so both import from here.
Each ContentChunk records which model embedded it, and retrieval only
compares against chunks from the current model.
"""

from __future__ import annotations

from sentence_transformers import SentenceTransformer

EMBEDDING_MODEL_NAME = "intfloat/multilingual-e5-small"

_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model


def embed_passages(texts: list[str]) -> list[list[float]]:
    vectors = get_embedding_model().encode(
        [f"passage: {t}" for t in texts],
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return [v.tolist() for v in vectors]


def embed_query(text: str) -> list[float]:
    vector = get_embedding_model().encode(
        f"query: {text}", normalize_embeddings=True
    )
    return vector.tolist()
