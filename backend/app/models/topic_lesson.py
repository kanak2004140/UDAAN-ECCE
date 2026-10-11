import uuid
from datetime import datetime

from sqlalchemy import ARRAY, CheckConstraint, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class TopicLesson(Base):
    """A generated lesson for one topic, stored so it is generated once, can
    be reviewed by a person, and can be bundled into the offline content pack.

    The lesson's language is the language of the topic's source book (a topic
    never mixes languages), so one row per topic is enough. Only
    `review_status = approved` lessons should be shown to children or shipped.
    """

    __tablename__ = "topic_lessons"

    __table_args__ = (
        CheckConstraint(
            "review_status IN ('pending_review', 'approved', 'rejected')",
            name="ck_topic_lessons_review_status",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    lesson_text: Mapped[str] = mapped_column(Text, nullable=False)
    content_chunk_ids: Mapped[list[uuid.UUID]] = mapped_column(ARRAY(UUID(as_uuid=True)), nullable=False)
    content_source_ids: Mapped[list[uuid.UUID]] = mapped_column(ARRAY(UUID(as_uuid=True)), nullable=False)
    generator_model: Mapped[str] = mapped_column(Text, nullable=False)
    review_status: Mapped[str] = mapped_column(Text, nullable=False, default="pending_review")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
