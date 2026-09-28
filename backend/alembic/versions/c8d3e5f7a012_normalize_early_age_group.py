"""normalize early age group

Revision ID: c8d3e5f7a012
Revises: b7c2d1e4f901
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c8d3e5f7a012"
down_revision: Union[str, Sequence[str], None] = "b7c2d1e4f901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    for table in ("activities", "topics", "children"):
        connection.execute(
            sa.text(f"UPDATE {table} SET age_group = '2-4' WHERE age_group = '3-4'")
        )
    connection.execute(
        sa.text("UPDATE curriculums SET min_age_group = '2-4' WHERE min_age_group = '3-4'")
    )


def downgrade() -> None:
    connection = op.get_bind()
    for table in ("activities", "topics", "children"):
        connection.execute(
            sa.text(f"UPDATE {table} SET age_group = '3-4' WHERE age_group = '2-4'")
        )
    connection.execute(
        sa.text("UPDATE curriculums SET min_age_group = '3-4' WHERE min_age_group = '2-4'")
    )
