from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity_attempt import ActivityAttempt
from app.schemas.activity_attempt import ActivityAttemptResponse


router = APIRouter(
    prefix="/activity-attempts",
    tags=["Activity Attempts"],
)


@router.get(
    "/session/{learning_session_id}",
    response_model=list[ActivityAttemptResponse],
)
def get_session_attempts(
    learning_session_id: UUID,
    db: Session = Depends(get_db),
):
    attempts = (
        db.query(ActivityAttempt)
        .filter(
            ActivityAttempt.learning_session_id == learning_session_id
        )
        .order_by(ActivityAttempt.started_at)
        .all()
    )

    return attempts