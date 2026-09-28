"""
Diagnostic: reports how activities are currently linked to learning objects,
so you can tell whether your dev DB has the old buggy seed data (everything
pointing at the single 2-4 "Animal Recognition" object) or the fixed
per-age-group structure.

Usage:
    python check_seed_data.py
"""

from sqlalchemy import func

from app.database import SessionLocal
from app.models.activity import Activity
from app.models.learning_object import LearningObject


def check_seed_data() -> None:
    db = SessionLocal()
    try:
        rows = (
            db.query(
                Activity.age_group,
                LearningObject.name,
                func.count(Activity.id),
            )
            .join(LearningObject, LearningObject.id == Activity.learning_object_id)
            .group_by(Activity.age_group, LearningObject.name)
            .order_by(Activity.age_group)
            .all()
        )

        if not rows:
            print("No activities found. Nothing to clean up - just run:")
            print("  python seed_dev.py")
            print("  python seed_age_groups.py")
            return

        print("age_group | learning_object            | activity_count")
        print("-" * 60)
        distinct_objects = set()
        for age_group, lo_name, count in rows:
            print(f"{age_group:<9} | {lo_name:<26} | {count}")
            distinct_objects.add(lo_name)

        print()
        if distinct_objects == {"Animal Recognition"}:
            print("=> OLD BUGGY DATA: every age group is linked to 'Animal")
            print("   Recognition' only. You need to clean up and reseed.")
        elif len(distinct_objects) == 1:
            print(f"=> Only one learning object ('{next(iter(distinct_objects))}') is")
            print("   in use across age groups - likely still on old/partial data.")
        else:
            print("=> Looks like the fixed per-age-group structure is in place.")

    finally:
        db.close()


if __name__ == "__main__":
    check_seed_data()
