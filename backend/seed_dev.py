import uuid

from app.database import SessionLocal

from app.models.curriculum import Curriculum
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.learning_object import LearningObject
from app.models.activity import Activity
from app.models.activity_content import ActivityContent
from app.models.content_variant import ContentVariant
from app.models.language import Language
from app.models.child import Child
from app.models.learning_session import LearningSession
from app.models.activity_attempt import ActivityAttempt
from app.models.learning_progress import LearningProgress


def seed():
    db = SessionLocal()

    try:
        # ---------------------------------------------------------
        # 1. LANGUAGE
        # ---------------------------------------------------------

        language = Language(
            code="en",
            name="English",
            native_name="English",
            is_active=True,
        )

        db.add(language)
        db.flush()

        # ---------------------------------------------------------
        # 2. CURRICULUM
        # ---------------------------------------------------------

        curriculum = Curriculum(
            name="ECCE Foundational Learning",
            description="Developmental learning curriculum for young children.",
            min_age_group="3-4",
            max_age_group="5-6",
            is_active=True,
        )

        db.add(curriculum)
        db.flush()

        # ---------------------------------------------------------
        # 3. SUBJECT
        # ---------------------------------------------------------

        subject = Subject(
            curriculum_id=curriculum.id,
            name="Early Language",
            description="Foundational language and vocabulary development.",
            display_order=1,
        )

        db.add(subject)
        db.flush()

        # ---------------------------------------------------------
        # 4. TOPIC
        # ---------------------------------------------------------

        topic = Topic(
            subject_id=subject.id,
            name="Animals",
            description="Recognizing and naming familiar animals.",
            age_group="3-4",
            difficulty_level=1,
            display_order=1,
        )

        db.add(topic)
        db.flush()

        # ---------------------------------------------------------
        # 5. LEARNING OBJECT
        # ---------------------------------------------------------

        learning_object = LearningObject(
            topic_id=topic.id,
            name="Animal Recognition",
            description="Learn to recognize common animals.",
            learning_objective="Child can recognize and identify familiar animals.",
            difficulty_level=1,
        )

        db.add(learning_object)
        db.flush()

        # ---------------------------------------------------------
        # 6. ACTIVITY
        # ---------------------------------------------------------

        activity = Activity(
            learning_object_id=learning_object.id,
            title="Identify the Animal",
            description="Identify the animal shown.",
            instructions="Look at the animal and choose the correct answer.",
            activity_type="image_choice",
            config={
                "options": [
                    "Cat",
                    "Dog",
                    "Cow",
                    "Bird"
                ]
            },
            age_group="3-4",
            difficulty_level=1,
            duration_seconds=60,
            display_order=1,
            is_active=True,
        )

        db.add(activity)
        db.flush()

        # ---------------------------------------------------------
        # 7. ACTIVITY CONTENT
        # ---------------------------------------------------------

        activity_content = ActivityContent(
            activity_id=activity.id,
            content_type="image",
            content_key="animals/cat",
            display_order=1,
            is_required=True,
            content_metadata={
                "description": "Picture of a cat"
            },
        )

        db.add(activity_content)
        db.flush()

        # ---------------------------------------------------------
        # 8. CONTENT VARIANT
        # ---------------------------------------------------------

        content_variant = ContentVariant(
            activity_content_id=activity_content.id,
            language_id=language.id,
            content_key="animals/cat",
            content_text="Cat",
            content_metadata={
                "display_text": "Cat"
            },
        )

        db.add(content_variant)
        db.flush()

        # ---------------------------------------------------------
        # 9. CHILD
        # ---------------------------------------------------------

        child = Child(
            name="Test Child",
            date_of_birth=__import__("datetime").date(2022, 8, 21),
            age=4,
            age_group="3-4",
            profile_image=None,
        )

        db.add(child)
        db.flush()

        # ---------------------------------------------------------
        # 10. LEARNING SESSION
        # ---------------------------------------------------------

        session = LearningSession(
            child_id=child.id,
            status="active",
        )

        db.add(session)
        db.flush()

        # ---------------------------------------------------------
        # 11. ACTIVITY ATTEMPT
        # ---------------------------------------------------------

        attempt = ActivityAttempt(
            learning_session_id=session.id,
            activity_id=activity.id,
            status="completed",
            response={
                "selected_answer": "Cat",
                "correct": True,
            },
        )

        db.add(attempt)
        db.flush()

        # ---------------------------------------------------------
        # 12. LEARNING PROGRESS
        # ---------------------------------------------------------

        progress = LearningProgress(
            child_id=child.id,
            learning_object_id=learning_object.id,
            status="in_progress",
            mastery_level=1,
            attempts_count=1,
            successful_attempts=1,
        )

        db.add(progress)
        db.commit()

        print()
        print("==========================================")
        print("ECCE DEVELOPMENT DATA CREATED")
        print("==========================================")
        print(f"Language ID:          {language.id}")
        print(f"Curriculum ID:       {curriculum.id}")
        print(f"Subject ID:          {subject.id}")
        print(f"Topic ID:            {topic.id}")
        print(f"Learning Object ID:  {learning_object.id}")
        print(f"Activity ID:         {activity.id}")
        print(f"Activity Content ID: {activity_content.id}")
        print(f"Content Variant ID:  {content_variant.id}")
        print(f"Child ID:            {child.id}")
        print(f"Session ID:          {session.id}")
        print(f"Attempt ID:          {attempt.id}")
        print(f"Progress ID:         {progress.id}")
        print("==========================================")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()