from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LearningProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    child_id: UUID
    learning_object_id: UUID
    status: str
    mastery_level: int
    attempts_count: int
    successful_attempts: int
    last_attempted_at: datetime | None
    created_at: datetime
    updated_at: datetime