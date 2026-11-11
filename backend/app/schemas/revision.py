from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class RevisionBase(BaseModel):
    topic_id: str
    scheduled_at: datetime
    notes: Optional[str] = None


class RevisionCreate(RevisionBase):
    pass


class RevisionComplete(BaseModel):
    recall_rating: int = Field(..., ge=1, le=5)  # 1 to 5 scale
    notes: Optional[str] = None


class RevisionUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class RevisionOut(RevisionBase):
    id: str
    user_id: str
    completed_at: Optional[datetime] = None
    status: str  # scheduled, completed, missed
    recall_rating: Optional[int] = None
    created_at: datetime

    topic_title: Optional[str] = None
    subject_id: Optional[str] = None
    subject_name: Optional[str] = None
    subject_colour: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
