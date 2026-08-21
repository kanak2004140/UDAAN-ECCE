from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LearningObjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    topic_id: UUID
    name: str
    description: str | None
    learning_objective: str | None
    difficulty_level: int
    created_at: datetime
    updated_at: datetime