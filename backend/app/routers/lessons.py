from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.topic import Topic
from app.models.user import User
from app.schemas.lesson import LessonGenerateRequest, LessonResponse
from app.services.lesson_generation import LessonGenerationError, generate_lesson_for_topic

router = APIRouter(
    prefix="/lessons",
    tags=["Lessons"],
)


@router.post("/generate", response_model=LessonResponse)
def generate_lesson(
    request: LessonGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic = db.query(Topic).filter(Topic.id == request.topic_id).first()
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")

    try:
        result = generate_lesson_for_topic(db, topic)
    except LessonGenerationError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return LessonResponse(
        topic_id=result.topic_id,
        topic_name=result.topic_name,
        age_group=result.age_group,
        lesson_text=result.lesson_text,
        content_chunk_ids=result.content_chunk_ids,
        content_source_ids=result.content_source_ids,
    )
