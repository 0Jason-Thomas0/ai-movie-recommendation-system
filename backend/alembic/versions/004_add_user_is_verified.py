"""Add missing is_verified column to users table

Revision ID: 004_add_user_is_verified
Revises: 003_add_genre_tmdb_id
Create Date: 2026-07-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004_add_user_is_verified'
down_revision = '003_add_genre_tmdb_id'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'is_verified')
