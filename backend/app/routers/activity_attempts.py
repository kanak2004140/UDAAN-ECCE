from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.activity import Activity
from app.models.activity_attempt import ActivityAttempt
from app.models.child import Child
from app.models.learning_session import LearningSession
from app.models.user import User
from app.schemas.activity_attempt import ActivityAttemptCreate, ActivityAttemptResponse


router = APIRouter(
    prefix="/activity-attempts",
    tags=["Activity Attempts"],
)


@router.post("", response_model=ActivityAttemptResponse, status_code=status.HTTP_201_CREATED)
def create_activity_attempt(
    data: ActivityAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(LearningSession)
        .join(Child, Child.id == LearningSession.child_id)
        .filter(LearningSession.id == data.learning_session_id, Child.user_id == current_user.id)
        .first()
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Learning session not found")

    activity_exists = db.query(Activity.id).filter(Activity.id == data.activity_id).first()
    if activity_exists is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    attempt = ActivityAttempt(
        learning_session_id=data.learning_session_id,
        activity_id=data.activity_id,
        status=data.status,
        response=data.response,
    )
    if data.status == "completed":
        from sqlalchemy.sql import func
        attempt.completed_at = func.now()
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


@router.get(
    "/session/{learning_session_id}",
    response_model=list[ActivityAttemptResponse],
)
def get_session_attempts(
    learning_session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = (
        db.query(ActivityAttempt)
        .join(LearningSession, LearningSession.id == ActivityAttempt.learning_session_id)
        .join(Child, Child.id == LearningSession.child_id)
        .filter(ActivityAttempt.learning_session_id == learning_session_id, Child.user_id == current_user.id)
        .order_by(ActivityAttempt.started_at)
        .all()
    )

    return attempts