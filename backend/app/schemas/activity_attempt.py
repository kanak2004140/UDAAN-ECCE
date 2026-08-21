from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ActivityAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    learning_session_id: UUID
    activity_id: UUID
    started_at: datetime
    completed_at: datetime | None
    status: str
    response: dict | None
    created_at: datetime
    updated_at: datetime