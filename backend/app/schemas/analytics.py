from datetime import date
from typing import List, Optional, Dict
from pydantic import BaseModel


class FocusTrendPoint(BaseModel):
    date: str  # YYYY-MM-DD
    day_name: str  # Mon, Tue, etc.
    minutes: int


class SubjectAnalyticsItem(BaseModel):
    subject_id: Optional[str]
    subject_name: str
    colour: str
    minutes: int
    percentage: float


class TechniqueUsageItem(BaseModel):
    technique_name: str
    category: str
    session_count: int
    total_minutes: int


class RecallPerformanceStats(BaseModel):
    total_reviews_count: int
    average_rating: float
    accuracy_percentage: float  # % of reviews with score >= 3
    retention_rating_distribution: Dict[int, int]  # score 0..5 -> count


class ConsistencyDay(BaseModel):
    date: str
    minutes: int
    session_count: int


class AnalyticsOverviewOut(BaseModel):
    # Lifetime summary
    total_focus_minutes: int
    total_sessions_count: int
    total_tasks_completed: int
    average_concentration_rating: float

    # Periods
    today_focus_minutes: int
    this_week_focus_minutes: int
    this_month_focus_minutes: int

    # Charts
    daily_focus_trend: List[FocusTrendPoint]
    subject_distribution: List[SubjectAnalyticsItem]
    technique_usage: List[TechniqueUsageItem]
    recall_performance: RecallPerformanceStats
    consistency_calendar: List[ConsistencyDay]
