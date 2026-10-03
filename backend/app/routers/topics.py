from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.topic import Topic
from app.schemas.topic import TopicResponse

router = APIRouter(
    prefix="/topics",
    tags=["Topics"],
)


@router.get("", response_model=list[TopicResponse])
def list_topics(
    age_group: str | None = None,
    subject_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Topic)
    if age_group is not None:
        query = query.filter(Topic.age_group == age_group)
    if subject_id is not None:
        query = query.filter(Topic.subject_id == subject_id)
    return query.order_by(Topic.display_order).all()


@router.get("/{topic_id}", response_model=TopicResponse)
def get_topic(
    topic_id: UUID,
    db: Session = Depends(get_db),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic
