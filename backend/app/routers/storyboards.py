from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.topic import Topic
from app.models.user import User
from app.schemas.storyboard import StoryboardGenerateRequest, StoryboardResponse
from app.services.lesson_generation import LessonGenerationError
from app.services.storyboard_generation import generate_storyboard_for_topic, get_storyboard

router = APIRouter(prefix="/storyboards", tags=["Storyboards"])


@router.get("/{topic_id}", response_model=StoryboardResponse)
def read_storyboard(
    topic_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    storyboard = get_storyboard(db, topic_id)
    if storyboard is None:
        raise HTTPException(status_code=404, detail="No storyboard for this topic yet")
    return storyboard


@router.post("/generate", response_model=StoryboardResponse)
def generate_storyboard(
    request: StoryboardGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic = db.query(Topic).filter(Topic.id == request.topic_id).first()
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    try:
        return generate_storyboard_for_topic(db, topic, regenerate=request.regenerate)
    except LessonGenerationError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
