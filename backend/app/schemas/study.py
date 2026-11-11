from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# Subject Schemas
class SubjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    colour: str = Field(default="#6366f1", max_length=20)


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None
    colour: Optional[str] = None


class SubjectOut(SubjectBase):
    id: str
    user_id: str
    created_at: datetime
    tasks_count: Optional[int] = 0
    completed_tasks_count: Optional[int] = 0
    total_study_minutes: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)


# Topic Schemas
class TopicBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    difficulty: str = Field(default="medium")  # easy, medium, hard
    estimated_duration: Optional[int] = None  # in minutes
    completion_status: str = Field(default="pending")  # pending, in_progress, completed


class TopicCreate(TopicBase):
    pass


class TopicUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_duration: Optional[int] = None
    completion_status: Optional[str] = None


class TopicOut(TopicBase):
    id: str
    user_id: str
    subject_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Task Schemas
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: str = Field(default="medium")  # low, medium, high, urgent
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None  # in minutes
    status: str = Field(default="pending")  # pending, in_progress, completed, cancelled
    subject_id: Optional[str] = None
    topic_id: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_duration: Optional[int] = None
    status: Optional[str] = None
    subject_id: Optional[str] = None
    topic_id: Optional[str] = None


class TaskOut(TaskBase):
    id: str
    user_id: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    subject_name: Optional[str] = None
    subject_colour: Optional[str] = None
    topic_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
