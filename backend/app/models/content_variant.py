import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class ContentVariant(Base):
    __tablename__ = "content_variants"

    __table_args__ = (
        UniqueConstraint(
            "activity_content_id",
            "language_id",
            name="uq_content_variant_content_language",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    activity_content_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "activity_contents.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    language_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "languages.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    content_key: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    content_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    content_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSONB,
        default=dict,
        nullable=False,
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