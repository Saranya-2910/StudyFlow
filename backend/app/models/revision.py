from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, TimestampMixin, utc_now


class Revision(Base, TimestampMixin):
    __tablename__ = "revisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)

    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="scheduled", nullable=False)  # scheduled, completed, missed
    recall_rating = Column(Integer, nullable=True)  # 1 to 5 scale
    notes = Column(Text, nullable=True)

    # Relationships
    topic = relationship("Topic")
