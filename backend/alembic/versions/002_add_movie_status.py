"""Add missing status column to movies table

Revision ID: 002_add_movie_status
Revises: 001_initial_schema
Create Date: 2026-07-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_movie_status'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('movies', sa.Column('status', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('movies', 'status')
