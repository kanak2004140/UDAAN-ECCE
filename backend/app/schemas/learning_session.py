from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LearningSessionCreate(BaseModel):
    child_id: UUID


class LearningSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    child_id: UUID
    started_at: datetime
    ended_at: datetime | None
    status: str
    created_at: datetime
    updated_at: datetime