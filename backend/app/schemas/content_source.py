from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ContentSourceResponse(BaseModel):
    """Read-only view. Content sources are created by the ingestion script,
    never directly by API clients."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    publisher: str
    source_url: str | None
    source_type: str
    mime_type: str
    language_id: UUID | None
    subject: str | None
    grade_or_stage: str | None
    age_group: str | None
    review_status: str
    attribution: str
    license_information: str | None
    collected_at: datetime
    created_at: datetime
