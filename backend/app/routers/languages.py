from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.language import Language
from app.schemas.language import LanguageResponse

router = APIRouter(
    prefix="/languages",
    tags=["Languages"],
)


@router.get("", response_model=list[LanguageResponse])
def list_languages(db: Session = Depends(get_db)):
    return (
        db.query(Language)
        .filter(Language.is_active.is_(True))
        .order_by(Language.name)
        .all()
    )
