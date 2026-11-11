from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


# ------------------ FEYNMAN SCHEMAS ------------------ #
class FeynmanBase(BaseModel):
    concept_title: str = Field(..., min_length=1, max_length=200)
    target_audience: str = Field(default="A 10-year old / complete beginner", max_length=100)
    explanation: str = Field(..., min_length=1)
    identified_gaps: Optional[str] = None
    simplified_analogy: Optional[str] = None
    topic_id: Optional[str] = None


class FeynmanCreate(FeynmanBase):
    pass


class FeynmanUpdate(BaseModel):
    concept_title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    target_audience: Optional[str] = None
    explanation: Optional[str] = None
    identified_gaps: Optional[str] = None
    simplified_analogy: Optional[str] = None
    topic_id: Optional[str] = None


class FeynmanOut(FeynmanBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    topic_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ------------------ BRAIN DUMP SCHEMAS ------------------ #
class BrainDumpBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    duration_seconds: int = Field(default=0, ge=0)
    knowledge_gaps: Optional[str] = None
    topic_id: Optional[str] = None


class BrainDumpCreate(BrainDumpBase):
    pass


class BrainDumpOut(BrainDumpBase):
    id: str
    user_id: str
    created_at: datetime
    topic_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ------------------ MIND MAP SCHEMAS ------------------ #
class MindMapBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    graph_data: Dict[str, Any] = Field(default_factory=dict)
    topic_id: Optional[str] = None


class MindMapCreate(MindMapBase):
    pass


class MindMapUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    graph_data: Optional[Dict[str, Any]] = None
    topic_id: Optional[str] = None


class MindMapOut(MindMapBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    topic_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
