from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.child import Child
from app.models.learning_object import LearningObject
from app.models.learning_progress import LearningProgress
from app.models.user import User
from app.schemas.learning_progress import LearningProgressResponse, LearningProgressUpdate


router = APIRouter(
    prefix="/learning-progress",
    tags=["Learning Progress"],
)


@router.post("", response_model=LearningProgressResponse)
def update_progress(
    data: LearningProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    child = db.query(Child).filter(Child.id == data.child_id, Child.user_id == current_user.id).first()
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")

    learning_object_exists = (
        db.query(LearningObject.id).filter(LearningObject.id == data.learning_object_id).first()
    )
    if learning_object_exists is None:
        raise HTTPException(status_code=404, detail="Learning object not found")

    progress = (
        db.query(LearningProgress)
        .filter(
            LearningProgress.child_id == data.child_id,
            LearningProgress.learning_object_id == data.learning_object_id,
        )
        .first()
    )
    if progress is None:
        progress = LearningProgress(
            child_id=data.child_id,
            learning_object_id=data.learning_object_id,
            status=data.status,
            mastery_level=0,
            attempts_count=0,
            successful_attempts=0,
        )
        db.add(progress)

    progress.status = data.status
    progress.mastery_level = max(0, min(100, data.mastery_level))
    progress.attempts_count += 1
    if data.successful:
        progress.successful_attempts += 1
    progress.last_attempted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(progress)
    return progress


@router.get(
    "/child/{child_id}",
    response_model=list[LearningProgressResponse],
)
def get_child_progress(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    progress = (
        db.query(LearningProgress)
        .join(Child, Child.id == LearningProgress.child_id)
        .filter(LearningProgress.child_id == child_id, Child.user_id == current_user.id)
        .order_by(LearningProgress.updated_at.desc())
        .all()
    )

    return progress