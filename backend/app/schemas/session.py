from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class StudySessionCreate(BaseModel):
    technique_id: str
    planned_duration: int = Field(..., gt=0)  # in seconds (e.g. 1500 for 25 min)
    task_id: Optional[str] = None
    subject_id: Optional[str] = None
    notes: Optional[str] = None


class StudySessionComplete(BaseModel):
    concentration_rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None


class StudySessionUpdate(BaseModel):
    notes: Optional[str] = None
    concentration_rating: Optional[int] = Field(default=None, ge=1, le=5)


class StudySessionOut(BaseModel):
    id: str
    user_id: str
    technique_id: str
    task_id: Optional[str] = None
    subject_id: Optional[str] = None

    planned_duration: int
    actual_duration: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    paused_at: Optional[datetime] = None
    paused_duration: int
    status: str  # running, paused, completed, cancelled

    notes: Optional[str] = None
    concentration_rating: Optional[int] = None

    # Enriched context
    technique_name: Optional[str] = None
    technique_slug: Optional[str] = None
    task_title: Optional[str] = None
    subject_name: Optional[str] = None
    subject_colour: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
