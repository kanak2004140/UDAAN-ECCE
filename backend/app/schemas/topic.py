from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subject_id: UUID
    name: str
    description: str | None
    age_group: str
    difficulty_level: int
    display_order: int
    created_at: datetime

    # Filled in by the topics list endpoint (None when not applicable).
    subject_name: str | None = None
    language_code: str | None = None
    language_name: str | None = None
    # "approved" | "pending_review" | None (no stored lesson yet)
    lesson_status: str | None = None
