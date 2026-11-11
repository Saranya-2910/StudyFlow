from typing import List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.goals import Achievement, UserAchievement
from app.models.session import StudySession
from app.models.flashcard import FlashcardReview
from app.models.study import Task
from app.schemas.goals import AchievementOut
from app.services.session_service import ensure_utc


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AchievementService:
    @staticmethod
    def evaluate_and_unlock(db: Session, user_id: str) -> None:
        """
        Dynamically evaluates user progress and automatically unlocks newly earned achievements.
        Only unlocks based on verified database records.
        """
        # 1. Gather stats
        # Total completed sessions
        completed_sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.status == "completed",
        ).all()
        session_count = len(completed_sessions)

        # Total minutes
        total_seconds = sum(s.actual_duration for s in completed_sessions)
        total_minutes = int(total_seconds // 60)

        # Streak days
        now = utc_now()
        today_date = now.date()
        yesterday_date = today_date - timedelta(days=1)
        study_dates = {ensure_utc(s.started_at).date() for s in completed_sessions if s.actual_duration > 0}

        streak_days = 0
        if today_date in study_dates:
            check = today_date
            while check in study_dates:
                streak_days += 1
                check -= timedelta(days=1)
        elif yesterday_date in study_dates:
            check = yesterday_date
            while check in study_dates:
                streak_days += 1
                check -= timedelta(days=1)

        # Flashcard reviews count
        flashcard_reviews_count = db.query(func.count(FlashcardReview.id)).filter(
            FlashcardReview.user_id == user_id
        ).scalar() or 0

        # Completed tasks count
        completed_tasks_count = db.query(func.count(Task.id)).filter(
            Task.user_id == user_id,
            Task.status == "completed",
        ).scalar() or 0

        # 2. Check each achievement
        unlocked_ach_ids = {
            ua.achievement_id for ua in db.query(UserAchievement).filter(
                UserAchievement.user_id == user_id
            ).all()
        }

        all_achievements = db.query(Achievement).all()
        newly_unlocked = False

        for ach in all_achievements:
            if ach.id in unlocked_ach_ids:
                continue

            criteria = ach.criteria or {}
            c_type = criteria.get("type")
            threshold = criteria.get("threshold", 0)

            qualifies = False
            if c_type == "session_count" and session_count >= threshold:
                qualifies = True
            elif c_type == "total_minutes" and total_minutes >= threshold:
                qualifies = True
            elif c_type == "streak_days" and streak_days >= threshold:
                qualifies = True
            elif c_type == "flashcard_reviews" and flashcard_reviews_count >= threshold:
                qualifies = True
            elif c_type == "completed_tasks" and completed_tasks_count >= threshold:
                qualifies = True

            if qualifies:
                ua = UserAchievement(
                    user_id=user_id,
                    achievement_id=ach.id,
                    unlocked_at=utc_now(),
                )
                db.add(ua)
                newly_unlocked = True

        if newly_unlocked:
            db.commit()

    @staticmethod
    def list_achievements(db: Session, user_id: str) -> List[AchievementOut]:
        # Always run evaluation first
        AchievementService.evaluate_and_unlock(db, user_id)

        user_unlocks = {
            ua.achievement_id: ua.unlocked_at
            for ua in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
        }

        achievements = db.query(Achievement).order_by(Achievement.name.asc()).all()
        result = []
        for a in achievements:
            out = AchievementOut.model_validate(a)
            if a.id in user_unlocks:
                out.is_unlocked = True
                out.unlocked_at = user_unlocks[a.id]
            else:
                out.is_unlocked = False
                out.unlocked_at = None
            result.append(out)
        return result
