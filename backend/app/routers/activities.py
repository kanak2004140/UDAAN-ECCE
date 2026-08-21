from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity import Activity
from app.schemas.activity import ActivityResponse


router = APIRouter(
    prefix="/activities",
    tags=["Activities"],
)


@router.get(
    "",
    response_model=list[ActivityResponse],
)
def get_activities(
    db: Session = Depends(get_db),
):
    activities = (
        db.query(Activity)
        .filter(Activity.is_active.is_(True))
        .order_by(Activity.display_order)
        .all()
    )

    return activities


@router.get(
    "/{activity_id}",
    response_model=ActivityResponse,
)
def get_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
):
    activity = (
        db.query(Activity)
        .filter(
            Activity.id == activity_id,
            Activity.is_active.is_(True),
        )
        .first()
    )

    if activity is None:
        raise HTTPException(
            status_code=404,
            detail="Activity not found",
        )

    return activity