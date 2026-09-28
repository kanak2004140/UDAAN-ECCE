from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.age_groups import age_group_for_date_of_birth, calculate_age
from app.database import get_db
from app.auth import get_current_user
from app.models.child import Child
from app.models.user import User
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
    current_user: User = Depends(get_current_user),
):
    # Always derive age/age_group from date_of_birth server-side. Client-sent
    # values are ignored so they can't be spoofed or fall out of sync.
    age_group = age_group_for_date_of_birth(data.date_of_birth)
    if age_group is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A child must be between 2 and 8 years old",
        )

    child = Child(
        name=data.name,
        date_of_birth=data.date_of_birth,
        age=calculate_age(data.date_of_birth),
        age_group=age_group,
        profile_image=data.profile_image,
        user_id=current_user.id,
    )

    db.add(child)
    db.commit()
    db.refresh(child)

    return child


@router.get(
    "",
    response_model=list[ChildResponse],
)
def list_my_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List children belonging to the current user, so callers can reuse an
    existing child record instead of creating a duplicate one each time."""
    return (
        db.query(Child)
        .filter(Child.user_id == current_user.id)
        .order_by(Child.created_at)
        .all()
    )


@router.get(
    "/{child_id}",
    response_model=ChildResponse,
)
def get_child(
    child_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    child = (
        db.query(Child)
        .filter(Child.id == child_id, Child.user_id == current_user.id)
        .first()
    )

    if child is None:
        raise HTTPException(
            status_code=404,
            detail="Child not found",
        )

    return child