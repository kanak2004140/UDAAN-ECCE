import uuid
from datetime import datetime

from sqlalchemy import ARRAY, CheckConstraint, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class TopicStoryboard(Base):
    """Language-independent visual plan for teaching one topic (Phase 19).

    A storyboard is an ordered list of scenes, each a purely visual
    description plus a duration - no spoken or on-screen text, so the same
    asset serves every language (the narration is a separate, cheap text
    script - Phase 20). `scenes` is what a renderer (image model, video
    model, or the slideshow player) consumes; swapping the renderer later
    does not change this table.
    """

    __tablename__ = "topic_storyboards"

    __table_args__ = (
        CheckConstraint(
            "review_status IN ('pending_review', 'approved', 'rejected')",
            name="ck_topic_storyboards_review_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    age_group: Mapped[str] = mapped_column(Text, nullable=False)
    scenes: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)
    content_chunk_ids: Mapped[list[uuid.UUID]] = mapped_column(ARRAY(UUID(as_uuid=True)), nullable=False)
    generator_model: Mapped[str] = mapped_column(Text, nullable=False)
    review_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending_review")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
