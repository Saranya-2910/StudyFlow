from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.session import StudySessionOut


class WeeklyFocusDay(BaseModel):
    date: str  # YYYY-MM-DD
    day_name: str  # Mon, Tue, etc.
    focus_minutes: int


class SubjectDistributionItem(BaseModel):
    subject_id: Optional[str]
    subject_name: str
    colour: str
    minutes: int


class DashboardSummaryOut(BaseModel):
    # Today's core metrics
    today_focus_minutes: int
    daily_goal_minutes: int
    daily_goal_progress_pct: int
    remaining_goal_minutes: int
    completed_sessions_count_today: int

    # Tasks metrics
    active_tasks_count: int
    completed_tasks_count_today: int

    # Habit & Consistency metrics
    current_streak_days: int
    total_lifetime_focus_minutes: int
    total_lifetime_sessions_count: int

    # Breakdowns & charts
    weekly_focus_summary: List[WeeklyFocusDay]
    subject_distribution: List[SubjectDistributionItem]
    recent_sessions: List[StudySessionOut]

    # Active session if one is currently in progress or paused
    active_session: Optional[StudySessionOut] = None
