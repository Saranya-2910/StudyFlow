from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin, utc_now


class FeynmanNote(Base, TimestampMixin):
    __tablename__ = "feynman_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)

    concept_title = Column(String(200), nullable=False)
    target_audience = Column(String(100), default="A 10-year old / complete beginner", nullable=False)
    explanation = Column(Text, nullable=False)
    identified_gaps = Column(Text, nullable=True)
    simplified_analogy = Column(Text, nullable=True)

    # Relationship
    topic = relationship("Topic")


class BrainDumpSession(Base):
    __tablename__ = "brain_dump_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    duration_seconds = Column(Integer, default=0, nullable=False)
    knowledge_gaps = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationship
    topic = relationship("Topic")


class MindMap(Base, TimestampMixin):
    __tablename__ = "mind_maps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(200), nullable=False)
    graph_data = Column(JSON, default=dict, nullable=False)  # JSON structure containing nodes & edges

    # Relationship
    topic = relationship("Topic")
