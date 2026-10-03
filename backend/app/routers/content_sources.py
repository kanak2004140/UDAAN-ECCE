from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.content_source import ContentSource
from app.models.user import User
from app.schemas.content_source import ContentSourceResponse


router = APIRouter(
    prefix="/content-sources",
    tags=["Content Sources"],
)


@router.get("", response_model=list[ContentSourceResponse])
def list_content_sources(
    age_group: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only reviewed/approved sources are ever exposed - pending or rejected
    # ones stay internal until a human approves them.
    query = db.query(ContentSource).filter(ContentSource.review_status == "approved")
    if age_group is not None:
        query = query.filter(ContentSource.age_group == age_group)
    return query.order_by(ContentSource.created_at).all()


@router.get("/{content_source_id}", response_model=ContentSourceResponse)
def get_content_source(
    content_source_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    source = (
        db.query(ContentSource)
        .filter(
            ContentSource.id == content_source_id,
            ContentSource.review_status == "approved",
        )
        .first()
    )
    if source is None:
        raise HTTPException(status_code=404, detail="Content source not found")
    return source
