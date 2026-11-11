from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, UserPreferences
from app.models.session import StudySession
from app.models.study import Task, Subject
from app.schemas.dashboard import DashboardSummaryOut, WeeklyFocusDay, SubjectDistributionItem
from app.services.session_service import SessionService, ensure_utc


class DashboardService:
    @staticmethod
    def get_summary(db: Session, user: User) -> DashboardSummaryOut:
        now = datetime.now(timezone.utc)
        today_date = now.date()

        # 1. User preferences (daily goal)
        prefs = db.query(UserPreferences).filter(UserPreferences.user_id == user.id).first()
        daily_goal_minutes = prefs.daily_goal_minutes if prefs else 120

        # 2. All completed sessions for this user
        all_completed = db.query(StudySession).filter(
            StudySession.user_id == user.id,
            StudySession.status == "completed",
        ).all()

        today_focus_seconds = 0
        completed_sessions_count_today = 0
        study_dates = set()

        for s in all_completed:
            s_started = ensure_utc(s.started_at)
            if s_started:
                s_date = s_started.date()
                if s.actual_duration > 0:
                    study_dates.add(s_date)
                if s_date == today_date:
                    today_focus_seconds += s.actual_duration
                    completed_sessions_count_today += 1

        today_focus_minutes = int(today_focus_seconds // 60)
        daily_goal_progress_pct = min(100, int((today_focus_minutes / daily_goal_minutes) * 100)) if daily_goal_minutes > 0 else 0
        remaining_goal_minutes = max(0, daily_goal_minutes - today_focus_minutes)

        # 3. Tasks statistics
        active_tasks_count = db.query(func.count(Task.id)).filter(
            Task.user_id == user.id,
            Task.status.in_(["pending", "in_progress"])
        ).scalar() or 0

        # Completed tasks today
        all_completed_tasks = db.query(Task.completed_at).filter(
            Task.user_id == user.id,
            Task.status == "completed",
        ).all()

        completed_tasks_count_today = 0
        for t in all_completed_tasks:
            t_comp = ensure_utc(t.completed_at)
            if t_comp and t_comp.date() == today_date:
                completed_tasks_count_today += 1

        # 4. Lifetime statistics
        total_lifetime_seconds = sum(s.actual_duration for s in all_completed)
        total_lifetime_focus_minutes = int(total_lifetime_seconds // 60)
        total_lifetime_sessions_count = len(all_completed)

        # 5. Streak calculation
        yesterday_date = today_date - timedelta(days=1)
        current_streak = 0
        if today_date in study_dates:
            check_date = today_date
            while check_date in study_dates:
                current_streak += 1
                check_date -= timedelta(days=1)
        elif yesterday_date in study_dates:
            check_date = yesterday_date
            while check_date in study_dates:
                current_streak += 1
                check_date -= timedelta(days=1)

        # 6. Weekly focus summary (past 7 days including today)
        weekly_summary: List[WeeklyFocusDay] = []
        for i in range(6, -1, -1):
            d = today_date - timedelta(days=i)
            day_sec = sum(
                s.actual_duration
                for s in all_completed
                if ensure_utc(s.started_at) and ensure_utc(s.started_at).date() == d
            )
            weekly_summary.append(
                WeeklyFocusDay(
                    date=d.strftime("%Y-%m-%d"),
                    day_name=d.strftime("%a"),
                    focus_minutes=int(day_sec // 60),
                )
            )

        # 7. Subject distribution (for completed sessions)
        subject_minutes: Dict[Optional[str], int] = {}
        for s in all_completed:
            mins = int(s.actual_duration // 60)
            if mins > 0:
                subject_minutes[s.subject_id] = subject_minutes.get(s.subject_id, 0) + mins

        distribution_items: List[SubjectDistributionItem] = []
        for s_id, mins in subject_minutes.items():
            if s_id:
                sub = db.query(Subject).filter(Subject.id == s_id).first()
                if sub:
                    distribution_items.append(
                        SubjectDistributionItem(
                            subject_id=sub.id,
                            subject_name=sub.name,
                            colour=sub.colour,
                            minutes=mins,
                        )
                    )
            else:
                distribution_items.append(
                    SubjectDistributionItem(
                        subject_id=None,
                        subject_name="General / Unassigned",
                        colour="#94a3b8",
                        minutes=mins,
                    )
                )

        # 8. Recent 5 sessions
        recent = db.query(StudySession).filter(
            StudySession.user_id == user.id,
            StudySession.status.in_(["completed", "cancelled"])
        ).order_by(StudySession.started_at.desc()).limit(5).all()
        recent_sessions = [SessionService._enrich_session_out(s) for s in recent]

        # 9. Active session (if any)
        active_session = SessionService.get_active_session(db, user.id)

        return DashboardSummaryOut(
            today_focus_minutes=today_focus_minutes,
            daily_goal_minutes=daily_goal_minutes,
            daily_goal_progress_pct=daily_goal_progress_pct,
            remaining_goal_minutes=remaining_goal_minutes,
            completed_sessions_count_today=completed_sessions_count_today,
            active_tasks_count=active_tasks_count,
            completed_tasks_count_today=completed_tasks_count_today,
            current_streak_days=current_streak,
            total_lifetime_focus_minutes=total_lifetime_focus_minutes,
            total_lifetime_sessions_count=total_lifetime_sessions_count,
            weekly_focus_summary=weekly_summary,
            subject_distribution=distribution_items,
            recent_sessions=recent_sessions,
            active_session=active_session,
        )
