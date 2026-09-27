import enum
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class WatchlistStatus(str, enum.Enum):
    TO_WATCH = "to_watch"
    WATCHING = "watching"
    WATCHED = "watched"


class WatchlistItem(Base):
    __tablename__ = "watchlist"
    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_user_movie_watchlist"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(WatchlistStatus), default=WatchlistStatus.TO_WATCH)
    added_at = Column(DateTime, default=datetime.utcnow)
    watched_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="watchlist")
    movie = relationship("Movie", back_populates="watchlist_items")

    def __repr__(self):
        return f"<WatchlistItem user={self.user_id} movie={self.movie_id} status={self.status}>"
