import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class ContentSource(Base):
    """One original, permitted educational resource (e.g. an official NCERT
    PDF) that content is derived from. Every piece of ingested content should
    be traceable back to a row here.

    file_hash is unique, which is what makes ingestion idempotent: ingesting
    the same file twice finds the existing row instead of creating a copy.
    """

    __tablename__ = "content_sources"

    __table_args__ = (
        CheckConstraint(
            "age_group IS NULL OR age_group IN ('2-4', '4-6', '6-8')",
            name="ck_content_sources_age_group",
        ),
        CheckConstraint(
            "review_status IN ('pending_review', 'approved', 'rejected')",
            name="ck_content_sources_review_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    publisher: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Path (or object-storage key later) of the ORIGINAL, unmodified file.
    original_file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_hash: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)

    language_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("languages.id", ondelete="SET NULL"),
        nullable=True,
    )

    subject: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grade_or_stage: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Stays NULL until classified. Never guessed on ingestion.
    age_group: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)

    # Nothing is served to learners until a human moves this to "approved".
    review_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending_review", index=True
    )

    attribution: Mapped[str] = mapped_column(Text, nullable=False)
    license_information: Mapped[str | None] = mapped_column(Text, nullable=True)

    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    source_metadata: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
