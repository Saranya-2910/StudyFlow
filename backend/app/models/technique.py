from sqlalchemy import Column, String, Text, Boolean, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid


class Technique(Base):
    __tablename__ = "techniques"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(50), nullable=False)  # Time Management, Learning, Revision, Productivity
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=False)
    default_configuration = Column(JSON, nullable=False, default=dict)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    sessions = relationship("StudySession", back_populates="technique")
    favourited_by = relationship("UserFavouriteTechnique", back_populates="technique", cascade="all, delete-orphan")


class UserFavouriteTechnique(Base):
    __tablename__ = "user_favourite_techniques"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    technique_id = Column(String(36), ForeignKey("techniques.id", ondelete="CASCADE"), nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("user_id", "technique_id", name="uq_user_technique_favourite"),
    )

    # Relationships
    user = relationship("User", back_populates="favourite_techniques")
    technique = relationship("Technique", back_populates="favourited_by")
