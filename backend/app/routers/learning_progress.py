from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.learning_progress import LearningProgress
from app.schemas.learning_progress import LearningProgressResponse


router = APIRouter(
    prefix="/learning-progress",
    tags=["Learning Progress"],
)


@router.get(
    "/child/{child_id}",
    response_model=list[LearningProgressResponse],
)
def get_child_progress(
    child_id: UUID,
    db: Session = Depends(get_db),
):
    progress = (
        db.query(LearningProgress)
        .filter(LearningProgress.child_id == child_id)
        .order_by(LearningProgress.updated_at.desc())
        .all()
    )

    return progress