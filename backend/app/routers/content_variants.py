from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.content_variant import ContentVariant
from app.schemas.content_variant import ContentVariantResponse


router = APIRouter(
    prefix="/activity-contents",
    tags=["Content Variants"],
)


@router.get(
    "/{activity_content_id}/variants",
    response_model=list[ContentVariantResponse],
)
def get_content_variants(
    activity_content_id: UUID,
    db: Session = Depends(get_db),
):
    variants = (
        db.query(ContentVariant)
        .filter(
            ContentVariant.activity_content_id == activity_content_id
        )
        .order_by(ContentVariant.created_at)
        .all()
    )

    return variants