"""add_public_content_tables

Revision ID: 0015_add_public_content_tables
Revises: 0014_add_user_is_active
Create Date: 2026-08-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, Enum, Index, UniqueConstraint
from sqlalchemy.sql import func
import enum

# revision identifiers, used by Alembic.
revision: str = '0015_add_public_content_tables'
down_revision: Union[str, None] = '0014_add_user_is_active'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'banners',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('link_url', sa.String(), nullable=True),
        sa.Column('position', sa.String(), nullable=False, server_default='hero'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_banners_sort_order', 'banners', ['sort_order'])

    op.create_table(
        'home_slides',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('subtitle', sa.String(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('link_url', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_home_slides_sort_order', 'home_slides', ['sort_order'])

    op.create_table(
        'blogs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('excerpt', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('cover_image_url', sa.String(), nullable=True),
        sa.Column('author_name', sa.String(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_unique_constraint('uq_blogs_slug', 'blogs', ['slug'])
    op.create_index('ix_blogs_slug', 'blogs', ['slug'])

    op.create_table(
        'site_logo',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('logo_url', sa.String(), nullable=False),
        sa.Column('favicon_url', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('site_logo')
    op.drop_table('blogs')
    op.drop_table('home_slides')
    op.drop_table('banners')
