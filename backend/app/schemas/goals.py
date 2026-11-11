from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class GoalBase(BaseModel):
    goal_type: str = Field(..., description="daily_time, weekly_time, or tasks_completed")
    target_value: int = Field(..., gt=0)
    period: str = Field(default="weekly")  # daily, weekly, monthly
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    target_value: Optional[int] = Field(default=None, gt=0)
    status: Optional[str] = None
    end_date: Optional[datetime] = None


class GoalOut(GoalBase):
    id: str
    user_id: str
    status: str  # active, completed, archived
    created_at: datetime
    current_value: int = 0
    progress_percentage: int = 0

    model_config = ConfigDict(from_attributes=True)


class AchievementOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    icon: str
    criteria: Dict[str, Any]
    is_unlocked: bool = False
    unlocked_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
