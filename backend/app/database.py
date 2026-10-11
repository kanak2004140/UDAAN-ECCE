from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str
    AUTH_SECRET_KEY: str = "ecce-development-secret-key-change-me-32chars"
    ANTHROPIC_API_KEY: str | None = None
    OPENROUTER_API_KEY: str | None = None
    OPENROUTER_MODEL: str = "nvidia/nemotron-3-super-120b-a12b:free"
    # Local Ollama: free, no daily limit, runs on the developer's machine only
    # (not usable by website/app users) - intended for bulk, one-off generation.
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    OLLAMA_MODEL: str = "qwen3:8b"
    # "auto" = Anthropic, else OpenRouter, else Ollama. Set explicitly to force one.
    LLM_PROVIDER: str = "auto"
    # Development only: let the API serve lessons/storyboards a person has not
    # approved yet (clearly unsafe for real children).
    ALLOW_DRAFT_LESSONS: bool = False


settings = Settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()