from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import String, cast, func
from sqlalchemy.orm import Session

from app.database import get_db, settings
from app.models.content_chunk import ContentChunk
from app.models.content_source import ContentSource
from app.models.language import Language
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.topic_lesson import TopicLesson
from app.schemas.topic import TopicResponse

router = APIRouter(
    prefix="/topics",
    tags=["Topics"],
)


@router.get("", response_model=list[TopicResponse])
def list_topics(
    age_group: str | None = None,
    subject_id: UUID | None = None,
    language_id: UUID | None = None,
    lesson_status: str | None = None,
    db: Session = Depends(get_db),
):
    """List topics, each with its subject, language and lesson status.

    `lesson_status=approved` returns only topics a child can actually be
    taught (an approved stored lesson exists). `lesson_status=any` also
    includes unreviewed drafts and is only honoured when the server is
    configured with ALLOW_DRAFT_LESSONS (development).
    """
    if lesson_status not in (None, "approved", "any"):
        raise HTTPException(status_code=422, detail="lesson_status must be 'approved' or 'any'")
    if lesson_status == "any" and not settings.ALLOW_DRAFT_LESSONS:
        lesson_status = "approved"

    # A topic's language is the language of the source book its chunks come from.
    language_of_topic = (
        db.query(
            ContentChunk.topic_id.label("topic_id"),
            func.min(Language.code).label("code"),
            func.min(Language.name).label("name"),
            func.min(cast(Language.id, String)).label("language_id"),
        )
        .join(ContentSource, ContentSource.id == ContentChunk.content_source_id)
        .join(Language, Language.id == ContentSource.language_id)
        .filter(ContentChunk.topic_id.isnot(None))
        .group_by(ContentChunk.topic_id)
        .subquery()
    )

    query = (
        db.query(Topic, Subject.name, language_of_topic.c.code, language_of_topic.c.name, TopicLesson.review_status)
        .join(Subject, Subject.id == Topic.subject_id)
        .outerjoin(language_of_topic, language_of_topic.c.topic_id == Topic.id)
        .outerjoin(TopicLesson, TopicLesson.topic_id == Topic.id)
    )
    if age_group is not None:
        query = query.filter(Topic.age_group == age_group)
    if subject_id is not None:
        query = query.filter(Topic.subject_id == subject_id)
    if language_id is not None:
        query = query.filter(language_of_topic.c.language_id == str(language_id))
    if lesson_status == "approved":
        query = query.filter(TopicLesson.review_status == "approved")
    elif lesson_status == "any":
        query = query.filter(TopicLesson.id.isnot(None))

    results = []
    for topic, subject_name, language_code, language_name, status in query.order_by(Topic.display_order, Topic.name):
        item = TopicResponse.model_validate(topic)
        item.subject_name = subject_name
        item.language_code = language_code
        item.language_name = language_name
        item.lesson_status = status
        results.append(item)
    return results


@router.get("/{topic_id}", response_model=TopicResponse)
def get_topic(
    topic_id: UUID,
    db: Session = Depends(get_db),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic
