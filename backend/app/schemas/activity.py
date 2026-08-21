from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    learning_object_id: UUID
    title: str
    description: str | None
    instructions: str | None
    activity_type: str
    config: dict
    age_group: str
    difficulty_level: int
    duration_seconds: int | None
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime