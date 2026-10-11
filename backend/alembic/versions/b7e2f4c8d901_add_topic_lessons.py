"""add topic lessons

Revision ID: b7e2f4c8d901
Revises: a1c9e7d2b345
Create Date: 2026-10-05 00:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b7e2f4c8d901'
down_revision: Union[str, Sequence[str], None] = 'a1c9e7d2b345'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'topic_lessons',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('lesson_text', sa.Text(), nullable=False),
        sa.Column('content_chunk_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False),
        sa.Column('content_source_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False),
        sa.Column('generator_model', sa.Text(), nullable=False),
        sa.Column('review_status', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("review_status IN ('pending_review', 'approved', 'rejected')", name='ck_topic_lessons_review_status'),
    )


def downgrade() -> None:
    op.drop_table('topic_lessons')
