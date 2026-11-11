from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin, utc_now


class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    colour = Column(String(20), default="#6366f1", nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_subject_name"),
    )

    # Relationships
    user = relationship("User", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="subject", cascade="all, delete-orphan")
    sessions = relationship("StudySession", back_populates="subject")


class Topic(Base, TimestampMixin):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(String(20), default="medium", nullable=False)  # easy, medium, hard
    estimated_duration = Column(Integer, nullable=True)  # in minutes
    completion_status = Column(String(20), default="pending", nullable=False)  # pending, in_progress, completed

    # Relationships
    user = relationship("User", back_populates="topics")
    subject = relationship("Subject", back_populates="topics")
    tasks = relationship("Task", back_populates="topic")


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, urgent
    due_date = Column(DateTime(timezone=True), nullable=True)
    estimated_duration = Column(Integer, nullable=True)  # in minutes
    status = Column(String(20), default="pending", nullable=False)  # pending, in_progress, completed, cancelled
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="tasks")
    subject = relationship("Subject", back_populates="tasks")
    topic = relationship("Topic", back_populates="tasks")
    sessions = relationship("StudySession", back_populates="task")
