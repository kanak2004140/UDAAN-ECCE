from uuid import UUID

from pydantic import BaseModel


class LessonGenerateRequest(BaseModel):
    topic_id: UUID


class LessonResponse(BaseModel):
    topic_id: UUID
    topic_name: str
    age_group: str
    lesson_text: str
    content_chunk_ids: list[UUID]
    content_source_ids: list[UUID]
