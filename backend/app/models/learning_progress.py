import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    __table_args__ = (
        UniqueConstraint(
            "child_id",
            "learning_object_id",
            name="uq_learning_progress_child_object",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    child_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "children.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    learning_object_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "learning_objects.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="not_started",
    )

    mastery_level: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    attempts_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    successful_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    last_attempted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )