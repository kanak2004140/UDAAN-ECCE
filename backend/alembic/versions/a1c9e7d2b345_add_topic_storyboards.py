"""add topic storyboards

Revision ID: a1c9e7d2b345
Revises: f5b4ccfa61cc
Create Date: 2026-10-04 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a1c9e7d2b345'
down_revision: Union[str, Sequence[str], None] = 'f5b4ccfa61cc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'topic_storyboards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('topics.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('age_group', sa.Text(), nullable=False),
        sa.Column('scenes', postgresql.JSONB(), nullable=False),
        sa.Column('content_chunk_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False),
        sa.Column('generator_model', sa.Text(), nullable=False),
        sa.Column('review_status', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("review_status IN ('pending_review', 'approved', 'rejected')", name='ck_topic_storyboards_review_status'),
    )


def downgrade() -> None:
    op.drop_table('topic_storyboards')
