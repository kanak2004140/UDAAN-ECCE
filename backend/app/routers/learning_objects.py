from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.learning_object import LearningObject
from app.schemas.learning_object import LearningObjectResponse


router = APIRouter(
    prefix="/learning-objects",
    tags=["Learning Objects"],
)


@router.get(
    "/",
    response_model=list[LearningObjectResponse],
)
def get_learning_objects(
    db: Session = Depends(get_db),
):
    learning_objects = (
        db.query(LearningObject)
        .order_by(LearningObject.created_at)
        .all()
    )

    return learning_objects


@router.get(
    "/{learning_object_id}",
    response_model=LearningObjectResponse,
)
def get_learning_object(
    learning_object_id: UUID,
    db: Session = Depends(get_db),
):
    learning_object = (
        db.query(LearningObject)
        .filter(LearningObject.id == learning_object_id)
        .first()
    )

    return learning_object