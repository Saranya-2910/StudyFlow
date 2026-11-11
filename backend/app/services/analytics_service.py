from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.session import StudySession
from app.models.study import Task, Subject
from app.models.technique import Technique
from app.models.flashcard import FlashcardReview
from app.schemas.analytics import (
    AnalyticsOverviewOut,
    FocusTrendPoint,
    SubjectAnalyticsItem,
    TechniqueUsageItem,
    RecallPerformanceStats,
    ConsistencyDay,
)
from app.services.session_service import ensure_utc


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AnalyticsService:
    @staticmethod
    def get_overview(db: Session, user_id: str, days: int = 14) -> AnalyticsOverviewOut:
        now = utc_now()
        today_date = now.date()

        # 1. Completed sessions
        completed_sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.status == "completed",
        ).all()

        total_focus_seconds = sum(s.actual_duration for s in completed_sessions)
        total_focus_minutes = int(total_focus_seconds // 60)
        total_sessions_count = len(completed_sessions)

        # Average concentration rating
        ratings = [s.concentration_rating for s in completed_sessions if s.concentration_rating is not None]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0

        # Total tasks completed
        total_tasks_completed = db.query(func.count(Task.id)).filter(
            Task.user_id == user_id,
            Task.status == "completed",
        ).scalar() or 0

        # Period minutes
        week_start = today_date - timedelta(days=today_date.weekday())
        month_start = today_date.replace(day=1)

        today_focus_mins = 0
        this_week_focus_mins = 0
        this_month_focus_mins = 0

        for s in completed_sessions:
            s_dt = ensure_utc(s.started_at)
            if not s_dt:
                continue
            s_d = s_dt.date()
            mins = int(s.actual_duration // 60)
            if s_d == today_date:
                today_focus_mins += mins
            if s_d >= week_start:
                this_week_focus_mins += mins
            if s_d >= month_start:
                this_month_focus_mins += mins

        # 2. Daily focus trend (last `days` days)
        trend: List[FocusTrendPoint] = []
        for i in range(days - 1, -1, -1):
            d = today_date - timedelta(days=i)
            day_sec = sum(
                s.actual_duration for s in completed_sessions
                if ensure_utc(s.started_at) and ensure_utc(s.started_at).date() == d
            )
            trend.append(
                FocusTrendPoint(
                    date=d.strftime("%Y-%m-%d"),
                    day_name=d.strftime("%a"),
                    minutes=int(day_sec // 60),
                )
            )

        # 3. Subject distribution
        subj_map = {s.id: s for s in db.query(Subject).filter(Subject.user_id == user_id).all()}
        subject_minutes: Dict[Optional[str], int] = {}
        for s in completed_sessions:
            mins = int(s.actual_duration // 60)
            if mins > 0:
                subject_minutes[s.subject_id] = subject_minutes.get(s.subject_id, 0) + mins

        subject_dist: List[SubjectAnalyticsItem] = []
        for sid, mins in subject_minutes.items():
            pct = round((mins / total_focus_minutes) * 100, 1) if total_focus_minutes > 0 else 0.0
            if sid and sid in subj_map:
                subject_dist.append(
                    SubjectAnalyticsItem(
                        subject_id=sid,
                        subject_name=subj_map[sid].name,
                        colour=subj_map[sid].colour,
                        minutes=mins,
                        percentage=pct,
                    )
                )
            else:
                subject_dist.append(
                    SubjectAnalyticsItem(
                        subject_id=None,
                        subject_name="General",
                        colour="#94a3b8",
                        minutes=mins,
                        percentage=pct,
                    )
                )

        # 4. Technique usage
        tech_map = {t.id: t for t in db.query(Technique).all()}
        tech_stats: Dict[str, Dict[str, int]] = {}
        for s in completed_sessions:
            tid = s.technique_id
            if tid not in tech_stats:
                tech_stats[tid] = {"count": 0, "minutes": 0}
            tech_stats[tid]["count"] += 1
            tech_stats[tid]["minutes"] += int(s.actual_duration // 60)

        technique_usage: List[TechniqueUsageItem] = []
        for tid, stat in tech_stats.items():
            tech = tech_map.get(tid)
            if tech:
                technique_usage.append(
                    TechniqueUsageItem(
                        technique_name=tech.name,
                        category=tech.category,
                        session_count=stat["count"],
                        total_minutes=stat["minutes"],
                    )
                )

        # 5. Recall performance
        reviews = db.query(FlashcardReview).filter(FlashcardReview.user_id == user_id).all()
        total_reviews = len(reviews)
        if total_reviews > 0:
            avg_recall = round(sum(r.quality_rating for r in reviews) / total_reviews, 2)
            successful_recalls = sum(1 for r in reviews if r.quality_rating >= 3)
            acc_pct = round((successful_recalls / total_reviews) * 100, 1)
            dist: Dict[int, int] = {i: 0 for i in range(6)}
            for r in reviews:
                dist[r.quality_rating] = dist.get(r.quality_rating, 0) + 1
        else:
            avg_recall = 0.0
            acc_pct = 0.0
            dist = {i: 0 for i in range(6)}

        recall_stats = RecallPerformanceStats(
            total_reviews_count=total_reviews,
            average_rating=avg_recall,
            accuracy_percentage=acc_pct,
            retention_rating_distribution=dist,
        )

        # 6. Consistency calendar (past 30 days)
        consistency: List[ConsistencyDay] = []
        for i in range(29, -1, -1):
            d = today_date - timedelta(days=i)
            day_sessions = [
                s for s in completed_sessions
                if ensure_utc(s.started_at) and ensure_utc(s.started_at).date() == d
            ]
            consistency.append(
                ConsistencyDay(
                    date=d.strftime("%Y-%m-%d"),
                    minutes=int(sum(s.actual_duration for s in day_sessions) // 60),
                    session_count=len(day_sessions),
                )
            )

        return AnalyticsOverviewOut(
            total_focus_minutes=total_focus_minutes,
            total_sessions_count=total_sessions_count,
            total_tasks_completed=total_tasks_completed,
            average_concentration_rating=avg_rating,
            today_focus_minutes=today_focus_mins,
            this_week_focus_minutes=this_week_focus_mins,
            this_month_focus_minutes=this_month_focus_mins,
            daily_focus_trend=trend,
            subject_distribution=subject_dist,
            technique_usage=technique_usage,
            recall_performance=recall_stats,
            consistency_calendar=consistency,
        )
