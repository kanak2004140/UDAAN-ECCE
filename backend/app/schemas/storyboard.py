from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class StoryboardGenerateRequest(BaseModel):
    topic_id: UUID
    regenerate: bool = False


class StoryboardScene(BaseModel):
    index: int
    visual_description: str
    duration_seconds: int
    narration_cue: str


class StoryboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    topic_id: UUID
    age_group: str
    scenes: list[StoryboardScene]
    content_chunk_ids: list[UUID]
    generator_model: str
    review_status: str
    created_at: datetime
