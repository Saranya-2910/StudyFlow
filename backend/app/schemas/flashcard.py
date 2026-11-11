from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class FlashcardBase(BaseModel):
    subject_id: str
    topic_id: Optional[str] = None
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)


class FlashcardCreate(FlashcardBase):
    pass


class FlashcardUpdate(BaseModel):
    question: Optional[str] = Field(default=None, min_length=1)
    answer: Optional[str] = Field(default=None, min_length=1)
    subject_id: Optional[str] = None
    topic_id: Optional[str] = None


class FlashcardReviewCreate(BaseModel):
    quality_rating: int = Field(..., ge=0, le=5)  # 0 to 5 SM-2 rating


class FlashcardOut(FlashcardBase):
    id: str
    user_id: str
    next_review_at: datetime
    interval_days: int
    ease_factor: float
    repetitions: int
    created_at: datetime
    subject_name: Optional[str] = None
    subject_colour: Optional[str] = None
    topic_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FlashcardDueSummary(BaseModel):
    due_count: int
    total_count: int
    subject_due_breakdown: dict[str, int]
