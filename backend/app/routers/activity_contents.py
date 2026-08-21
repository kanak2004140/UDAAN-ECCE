from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity_content import ActivityContent
from app.schemas.activity_content import ActivityContentResponse


router = APIRouter(
    prefix="/activities",
    tags=["Activity Contents"],
)


@router.get(
    "/{activity_id}/contents",
    response_model=list[ActivityContentResponse],
)
def get_activity_contents(
    activity_id: UUID,
    db: Session = Depends(get_db),
):
    contents = (
        db.query(ActivityContent)
        .filter(ActivityContent.activity_id == activity_id)
        .order_by(ActivityContent.display_order)
        .all()
    )

    return contents