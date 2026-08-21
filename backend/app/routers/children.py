from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.child import Child
from app.schemas.child import ChildCreate, ChildResponse


router = APIRouter(
    prefix="/children",
    tags=["Children"],
)


@router.post(
    "",
    response_model=ChildResponse,
)
def create_child(
    data: ChildCreate,
    db: Session = Depends(get_db),
):
    child = Child(
        name=data.name,
        date_of_birth=data.date_of_birth,
        age=data.age,
        age_group=data.age_group,
        profile_image=data.profile_image,
    )

    db.add(child)
    db.commit()
    db.refresh(child)

    return child


@router.get(
    "/{child_id}",
    response_model=ChildResponse,
)
def get_child(
    child_id: UUID,
    db: Session = Depends(get_db),
):
    child = (
        db.query(Child)
        .filter(Child.id == child_id)
        .first()
    )

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Child not found",
        )

    return child