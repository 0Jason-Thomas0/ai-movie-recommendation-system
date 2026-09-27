"""Initial schema: users, movies, genres, ratings, watchlist, favorites, recommendations, notifications

Revision ID: 001_initial_schema
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── genres ───────────────────────────────────────────────────────────────
    op.create_table(
        'genres',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_index('ix_genres_id', 'genres', ['id'])

    # ─── movies ───────────────────────────────────────────────────────────────
    op.create_table(
        'movies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('original_title', sa.String(length=500), nullable=True),
        sa.Column('overview', sa.Text(), nullable=True),
        sa.Column('tagline', sa.String(length=500), nullable=True),
        sa.Column('tmdb_id', sa.Integer(), nullable=True),
        sa.Column('imdb_id', sa.String(length=20), nullable=True),
        sa.Column('movielens_id', sa.Integer(), nullable=True),
        sa.Column('poster_path', sa.String(length=500), nullable=True),
        sa.Column('backdrop_path', sa.String(length=500), nullable=True),
        sa.Column('trailer_key', sa.String(length=100), nullable=True),
        sa.Column('release_date', sa.String(length=20), nullable=True),
        sa.Column('release_year', sa.Integer(), nullable=True),
        sa.Column('runtime', sa.Integer(), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=True),
        sa.Column('director', sa.String(length=200), nullable=True),
        sa.Column('cast', sa.Text(), nullable=True),
        sa.Column('imdb_rating', sa.Float(), nullable=True),
        sa.Column('tmdb_rating', sa.Float(), nullable=True),
        sa.Column('popularity', sa.Float(), nullable=False, server_default='0'),
        sa.Column('vote_count', sa.Integer(), nullable=True),
        sa.Column('avg_rating', sa.Float(), nullable=False, server_default='0'),
        sa.Column('rating_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_trending', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('poster_url', sa.String(length=500), nullable=True),
        sa.Column('backdrop_url', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_movies_id', 'movies', ['id'])
    op.create_index('ix_movies_title', 'movies', ['title'])
    op.create_index('ix_movies_tmdb_id', 'movies', ['tmdb_id'], unique=True)

    # ─── movie_genres (association) ───────────────────────────────────────────
    op.create_table(
        'movie_genres',
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('genre_id', sa.Integer(), sa.ForeignKey('genres.id', ondelete='CASCADE'), nullable=False),
        sa.PrimaryKeyConstraint('movie_id', 'genre_id'),
    )

    # ─── users ────────────────────────────────────────────────────────────────
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('role', sa.Enum('user', 'admin', 'guest', name='userrole'), nullable=False, server_default='user'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('favorite_genres', sa.JSON(), nullable=True),
        sa.Column('dark_mode', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('email_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('recommendation_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('reset_token', sa.String(length=255), nullable=True),
        sa.Column('reset_token_expires', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'])

    # ─── ratings ──────────────────────────────────────────────────────────────
    op.create_table(
        'ratings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rating', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'movie_id', name='uq_user_movie_rating'),
    )
    op.create_index('ix_ratings_id', 'ratings', ['id'])
    op.create_index('ix_ratings_user_id', 'ratings', ['user_id'])
    op.create_index('ix_ratings_movie_id', 'ratings', ['movie_id'])

    # ─── watchlist ────────────────────────────────────────────────────────────
    op.create_table(
        'watchlist',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.Enum('to_watch', 'watching', 'watched', name='watchliststatus'), nullable=True),
        sa.Column('added_at', sa.DateTime(), nullable=True),
        sa.Column('watched_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'movie_id', name='uq_user_movie_watchlist'),
    )
    op.create_index('ix_watchlist_id', 'watchlist', ['id'])
    op.create_index('ix_watchlist_user_id', 'watchlist', ['user_id'])
    op.create_index('ix_watchlist_movie_id', 'watchlist', ['movie_id'])

    # ─── favorites ────────────────────────────────────────────────────────────
    op.create_table(
        'favorites',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'movie_id', name='uq_user_movie_favorite'),
    )
    op.create_index('ix_favorites_id', 'favorites', ['id'])
    op.create_index('ix_favorites_user_id', 'favorites', ['user_id'])

    # ─── recommendations ──────────────────────────────────────────────────────
    op.create_table(
        'recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('model_version', sa.String(length=50), nullable=True),
        sa.Column('algorithm', sa.String(length=100), nullable=True),
        sa.Column('generated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_recommendations_id', 'recommendations', ['id'])
    op.create_index('ix_recommendations_user_id', 'recommendations', ['user_id'])

    # ─── recommendation_items ─────────────────────────────────────────────────
    op.create_table(
        'recommendation_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recommendation_id', sa.Integer(), sa.ForeignKey('recommendations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('movie_id', sa.Integer(), sa.ForeignKey('movies.id', ondelete='SET NULL'), nullable=True),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    # ─── notifications ────────────────────────────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.Enum('recommendation', 'watchlist', 'model_update', 'system', name='notificationtype'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_id', 'notifications', ['id'])
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('recommendation_items')
    op.drop_table('recommendations')
    op.drop_table('favorites')
    op.drop_table('watchlist')
    op.drop_table('ratings')
    op.drop_table('users')
    op.drop_table('movie_genres')
    op.drop_table('movies')
    op.drop_table('genres')
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS watchliststatus")
    op.execute("DROP TYPE IF EXISTS notificationtype")
