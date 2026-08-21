from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ActivityContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    activity_id: UUID
    content_type: str
    content_key: str
    display_order: int
    is_required: bool
    content_metadata: dict
    created_at: datetime
    updated_at: datetime