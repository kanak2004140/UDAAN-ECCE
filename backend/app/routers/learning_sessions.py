from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.learning_session import LearningSession
from app.models.child import Child
from app.models.user import User
from app.schemas.learning_session import (
    LearningSessionCreate,
    LearningSessionResponse,
)


router = APIRouter(
    prefix="/learning-sessions",
    tags=["Learning Sessions"],
)


@router.post(
    "",
    response_model=LearningSessionResponse,
)
def create_learning_session(
    data: LearningSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    child = (
        db.query(Child)
        .filter(Child.id == data.child_id, Child.user_id == current_user.id)
        .first()
    )

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Child not found",
        )

    session = LearningSession(
        child_id=data.child_id,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get(
    "/{session_id}",
    response_model=LearningSessionResponse,
)
def get_learning_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = (
        db.query(LearningSession)
        .join(Child, Child.id == LearningSession.child_id)
        .filter(LearningSession.id == session_id, Child.user_id == current_user.id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Learning session not found",
        )

    return session