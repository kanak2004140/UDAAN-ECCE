"""add user auth fields

Revision ID: b7c2d1e4f901
Revises: 6dfc50864d6a
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b7c2d1e4f901"
down_revision: Union[str, Sequence[str], None] = "6dfc50864d6a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("date_of_birth", sa.Date(), nullable=True))
    op.add_column("children", sa.Column("user_id", sa.UUID(), nullable=True))
    op.create_index("ix_children_user_id", "children", ["user_id"], unique=False)
    op.create_foreign_key(
        "fk_children_user_id_users",
        "children",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_children_user_id_users", "children", type_="foreignkey")
    op.drop_index("ix_children_user_id", table_name="children")
    op.drop_column("children", "user_id")
    op.drop_column("users", "date_of_birth")
