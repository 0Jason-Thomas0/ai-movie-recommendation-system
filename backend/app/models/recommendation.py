from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class Recommendation(Base):
    """A batch of recommendations generated for a user."""
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    model_version = Column(String(50), nullable=True)
    algorithm = Column(String(100), nullable=True)  # e.g., "hybrid", "content", "popular"
    generated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="recommendations")
    items = relationship("RecommendationItem", back_populates="recommendation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Recommendation user={self.user_id} at={self.generated_at}>"


class RecommendationItem(Base):
    """Individual movie within a recommendation batch."""
    __tablename__ = "recommendation_items"

    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.id", ondelete="CASCADE"), nullable=False, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, nullable=True)  # Predicted rating / similarity score
    reason = Column(Text, nullable=True)  # "Because you liked Inception"
    rank = Column(Integer, nullable=False, default=1)

    # Relationships
    recommendation = relationship("Recommendation", back_populates="items")
    movie = relationship("Movie")

    def __repr__(self):
        return f"<RecItem movie={self.movie_id} score={self.score}>"
