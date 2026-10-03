import uuid
from datetime import datetime

from sqlalchemy import ARRAY, CheckConstraint, DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class ContentChunk(Base):
    """One retrievable piece of a `ContentSource`'s extracted text (Phase 16),
    tagged with age-band/topic classification once reviewed (Phase 17), and
    used as RAG context for lesson generation (Phase 18).

    `embedding` is stored as a plain float array rather than a native
    `pgvector` column: the `vector` Postgres extension isn't installed on
    this server yet (it needs a system-level install with admin rights).
    Retrieval currently does cosine similarity in Python, which is fine at
    this content volume - swap this column for `pgvector.sqlalchemy.Vector`
    and add an ANN index once the extension is available, no other code
    needs to change.
    """

    __tablename__ = "content_chunks"

    __table_args__ = (
        CheckConstraint(
            "age_group IS NULL OR age_group IN ('2-4', '4-6', '6-8')",
            name="ck_content_chunks_age_group",
        ),
        CheckConstraint(
            "review_status IN ('pending_review', 'approved', 'rejected')",
            name="ck_content_chunks_review_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    content_source_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("content_sources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)

    embedding_model: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(ARRAY(Float), nullable=False)

    # Classification (Phase 17) - stays NULL until a human/rule-based pass
    # assigns it. Mirrors ContentSource's "never guessed on ingestion" rule.
    age_group: Mapped[str | None] = mapped_column(Text, nullable=True, index=True)
    topic_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    review_status: Mapped[str] = mapped_column(
        Text, nullable=False, default="pending_review", index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
