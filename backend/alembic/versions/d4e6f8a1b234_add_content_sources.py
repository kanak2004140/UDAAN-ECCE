"""add content sources

Revision ID: d4e6f8a1b234
Revises: c8d3e5f7a012
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "d4e6f8a1b234"
down_revision: Union[str, Sequence[str], None] = "c8d3e5f7a012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "content_sources",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("publisher", sa.String(length=255), nullable=False),
        sa.Column("source_url", sa.String(length=1000), nullable=True),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("original_file_path", sa.String(length=1000), nullable=False),
        sa.Column("file_hash", sa.String(length=64), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("language_id", sa.UUID(), nullable=True),
        sa.Column("subject", sa.String(length=100), nullable=True),
        sa.Column("grade_or_stage", sa.String(length=100), nullable=True),
        sa.Column("age_group", sa.String(length=10), nullable=True),
        sa.Column(
            "review_status",
            sa.String(length=20),
            nullable=False,
            server_default="pending_review",
        ),
        sa.Column("attribution", sa.Text(), nullable=False),
        sa.Column("license_information", sa.Text(), nullable=True),
        sa.Column("collected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "source_metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "age_group IS NULL OR age_group IN ('2-4', '4-6', '6-8')",
            name="ck_content_sources_age_group",
        ),
        sa.CheckConstraint(
            "review_status IN ('pending_review', 'approved', 'rejected')",
            name="ck_content_sources_review_status",
        ),
        sa.ForeignKeyConstraint(
            ["language_id"], ["languages.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_content_sources_file_hash", "content_sources", ["file_hash"], unique=True
    )
    op.create_index("ix_content_sources_age_group", "content_sources", ["age_group"])
    op.create_index(
        "ix_content_sources_review_status", "content_sources", ["review_status"]
    )


def downgrade() -> None:
    op.drop_index("ix_content_sources_review_status", table_name="content_sources")
    op.drop_index("ix_content_sources_age_group", table_name="content_sources")
    op.drop_index("ix_content_sources_file_hash", table_name="content_sources")
    op.drop_table("content_sources")
