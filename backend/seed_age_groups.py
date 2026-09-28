from app.database import SessionLocal
from app.models.activity import Activity
from app.models.activity_content import ActivityContent
from app.models.content_variant import ContentVariant
from app.models.curriculum import Curriculum
from app.models.language import Language
from app.models.learning_object import LearningObject
from app.models.subject import Subject
from app.models.topic import Topic


# Each world's activities are grouped under a Topic/LearningObject that
# actually matches its own age group and subject area - NOT reused across
# age groups. Previously every activity here (including the 4-6 "shapes"
# and 6-8 "counting" activities) was attached to the single 2-4
# "Animal Recognition" learning object created by seed_dev.py, which meant
# LearningProgress rows for a 6-8 child completing a counting activity were
# recorded against a 2-4 animal-recognition objective. This structure fixes
# that by giving each subject area its own Topic + LearningObject per age
# group it actually appears in.

SUBJECTS = [
    {
        "name": "Early Language",
        "description": "Foundational language and vocabulary development.",
        "reuse_existing": True,  # created by seed_dev.py
    },
    {
        "name": "Early Math",
        "description": "Foundational shape, number, and counting concepts.",
        "reuse_existing": False,
    },
]

TOPICS = [
    {
        "subject": "Early Language",
        "name": "Animals",
        "age_group": "2-4",
        "reuse_existing": True,  # created by seed_dev.py
        "learning_object": {
            "name": "Animal Recognition",
            "description": "Learn to recognize common animals.",
            "learning_objective": "Child can recognize and identify familiar animals.",
            "reuse_existing": True,  # created by seed_dev.py
        },
    },
    {
        "subject": "Early Language",
        "name": "Colors",
        "age_group": "2-4",
        "learning_object": {
            "name": "Color Recognition",
            "description": "Learn to recognize and name common colors.",
            "learning_objective": "Child can recognize and name familiar colors.",
        },
    },
    {
        "subject": "Early Math",
        "name": "Shapes",
        "age_group": "4-6",
        "learning_object": {
            "name": "Shape Recognition",
            "description": "Learn to recognize and name common shapes.",
            "learning_objective": "Child can recognize and name basic shapes.",
        },
    },
    {
        "subject": "Early Math",
        "name": "Numbers",
        "age_group": "6-8",
        "learning_object": {
            "name": "Counting",
            "description": "Learn to count and recognize quantities.",
            "learning_objective": "Child can count a small set of objects accurately.",
        },
    },
]

WORLDS = [
    {
        "age_group": "2-4",
        "topic": "Animals",
        "title": "Find the Dog",
        "description": "Look at the picture and find the dog.",
        "activity_type": "image_choice",
        "content_key": "animals/dog",
        "content_text": "Dog",
        "options": ["Dog", "Cat", "Cow", "Bird"],
    },
    {
        "age_group": "2-4",
        "topic": "Colors",
        "title": "Name the Color",
        "description": "Look at the color and choose its name.",
        "activity_type": "image_choice",
        "content_key": "colors/red",
        "content_text": "Red",
        "options": ["Red", "Blue", "Yellow", "Green"],
    },
    {
        "age_group": "4-6",
        "topic": "Shapes",
        "title": "Sort the Shapes",
        "description": "Choose the shape that matches the example.",
        "activity_type": "shape_choice",
        "content_key": "shapes/circle",
        "content_text": "Circle",
        "options": ["Circle", "Triangle", "Square"],
    },
    {
        "age_group": "4-6",
        "topic": "Shapes",
        "title": "Find the Triangle",
        "description": "Choose the shape with three sides.",
        "activity_type": "shape_choice",
        "content_key": "shapes/triangle",
        "content_text": "Triangle",
        "options": ["Triangle", "Circle", "Square"],
    },
    {
        "age_group": "4-6",
        "topic": "Shapes",
        "title": "Find the Square",
        "description": "Choose the shape with four equal sides.",
        "activity_type": "shape_choice",
        "content_key": "shapes/square",
        "content_text": "Square",
        "options": ["Square", "Circle", "Triangle"],
    },
    {
        "age_group": "6-8",
        "topic": "Numbers",
        "title": "Count the Stars",
        "description": "Count the stars and choose the right number.",
        "activity_type": "number_choice",
        "content_key": "stars/five",
        "content_text": "Five",
        "options": ["Five", "Three", "Seven"],
    },
    {
        "age_group": "6-8",
        "topic": "Numbers",
        "title": "Count Three Stars",
        "description": "Count the stars and choose the right number.",
        "activity_type": "number_choice",
        "content_key": "stars/three",
        "content_text": "Three",
        "options": ["Three", "Five", "Eight"],
    },
    {
        "age_group": "6-8",
        "topic": "Numbers",
        "title": "Count Seven Stars",
        "description": "Count the stars and choose the right number.",
        "activity_type": "number_choice",
        "content_key": "stars/seven",
        "content_text": "Seven",
        "options": ["Seven", "Five", "Nine"],
    },
]


def get_or_create_subject(db, curriculum_id, spec, display_order):
    subject = db.query(Subject).filter(Subject.name == spec["name"]).first()
    if subject is not None:
        return subject

    subject = Subject(
        curriculum_id=curriculum_id,
        name=spec["name"],
        description=spec["description"],
        display_order=display_order,
    )
    db.add(subject)
    db.flush()
    return subject


def get_or_create_topic(db, subject_id, spec, display_order):
    topic = (
        db.query(Topic)
        .filter(Topic.subject_id == subject_id, Topic.name == spec["name"])
        .first()
    )
    if topic is not None:
        return topic

    topic = Topic(
        subject_id=subject_id,
        name=spec["name"],
        description=f"{spec['name']} for the {spec['age_group']} age group.",
        age_group=spec["age_group"],
        difficulty_level=1,
        display_order=display_order,
    )
    db.add(topic)
    db.flush()
    return topic


def get_or_create_learning_object(db, topic_id, spec):
    learning_object = (
        db.query(LearningObject)
        .filter(LearningObject.topic_id == topic_id, LearningObject.name == spec["name"])
        .first()
    )
    if learning_object is not None:
        return learning_object

    learning_object = LearningObject(
        topic_id=topic_id,
        name=spec["name"],
        description=spec["description"],
        learning_objective=spec["learning_objective"],
        difficulty_level=1,
    )
    db.add(learning_object)
    db.flush()
    return learning_object


def seed_age_groups() -> None:
    db = SessionLocal()
    try:
        language = db.query(Language).filter(Language.code == "en").first()
        curriculum = db.query(Curriculum).order_by(Curriculum.created_at).first()
        if language is None or curriculum is None:
            raise RuntimeError("Run seed_dev.py before seed_age_groups.py")

        subjects_by_name = {
            spec["name"]: get_or_create_subject(db, curriculum.id, spec, index + 1)
            for index, spec in enumerate(SUBJECTS)
        }

        learning_objects_by_topic = {}
        for index, spec in enumerate(TOPICS):
            subject = subjects_by_name[spec["subject"]]
            topic = get_or_create_topic(db, subject.id, spec, index + 1)
            learning_objects_by_topic[spec["name"]] = get_or_create_learning_object(
                db, topic.id, spec["learning_object"]
            )

        for world in WORLDS:
            activity = (
                db.query(Activity)
                .filter(
                    Activity.age_group == world["age_group"],
                    Activity.title == world["title"],
                )
                .first()
            )
            if activity is not None:
                continue

            learning_object = learning_objects_by_topic[world["topic"]]

            activity = Activity(
                learning_object_id=learning_object.id,
                title=world["title"],
                description=world["description"],
                instructions="Choose the best answer.",
                activity_type=world["activity_type"],
                config={"options": world["options"]},
                age_group=world["age_group"],
                difficulty_level=1,
                duration_seconds=60,
                display_order=1,
                is_active=True,
            )
            db.add(activity)
            db.flush()

            content = ActivityContent(
                activity_id=activity.id,
                content_type="image",
                content_key=world["content_key"],
                display_order=1,
                is_required=True,
                content_metadata={"description": world["content_text"]},
            )
            db.add(content)
            db.flush()

            db.add(
                ContentVariant(
                    activity_content_id=content.id,
                    language_id=language.id,
                    content_key=world["content_key"],
                    content_text=world["content_text"],
                    content_metadata={"display_text": world["content_text"]},
                )
            )

        db.commit()
        print("Age-group activities are ready for 2-4, 4-6, and 6-8.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_age_groups()
