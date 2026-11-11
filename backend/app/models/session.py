from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin, utc_now


class StudySession(Base, TimestampMixin):
    __tablename__ = "study_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    technique_id = Column(String(36), ForeignKey("techniques.id", ondelete="RESTRICT"), nullable=False, index=True)

    # Durations in seconds
    planned_duration = Column(Integer, nullable=False)
    actual_duration = Column(Integer, default=0, nullable=False)

    started_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    paused_at = Column(DateTime(timezone=True), nullable=True)
    paused_duration = Column(Integer, default=0, nullable=False)  # accumulated seconds paused

    # Status: 'running', 'paused', 'completed', 'cancelled'
    status = Column(String(20), default="running", nullable=False, index=True)

    notes = Column(Text, nullable=True)
    concentration_rating = Column(Integer, nullable=True)  # 1 to 5 scale

    # Relationships
    user = relationship("User", back_populates="sessions")
    task = relationship("Task", back_populates="sessions")
    subject = relationship("Subject", back_populates="sessions")
    technique = relationship("Technique", back_populates="sessions")
