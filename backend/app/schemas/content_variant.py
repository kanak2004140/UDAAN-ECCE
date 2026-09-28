from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ContentVariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    activity_content_id: UUID
    language_id: UUID
    content_key: str
    content_text: str | None
    metadata: dict = Field(validation_alias="content_metadata")
    created_at: datetime
    updated_at: datetime