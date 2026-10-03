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
