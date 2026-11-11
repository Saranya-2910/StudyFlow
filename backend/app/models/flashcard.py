from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin, utc_now


class Flashcard(Base, TimestampMixin):
    __tablename__ = "flashcards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)

    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    # SM-2 Spaced Repetition Fields
    next_review_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    interval_days = Column(Integer, default=1, nullable=False)
    ease_factor = Column(Float, default=2.50, nullable=False)
    repetitions = Column(Integer, default=0, nullable=False)

    # Relationships
    reviews = relationship("FlashcardReview", back_populates="flashcard", cascade="all, delete-orphan")


class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    flashcard_id = Column(String(36), ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    quality_rating = Column(Integer, nullable=False)  # 0 to 5
    reviewed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    previous_interval = Column(Integer, nullable=False)
    next_interval = Column(Integer, nullable=False)

    # Relationships
    flashcard = relationship("Flashcard", back_populates="reviews")
