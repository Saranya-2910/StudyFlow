from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.goals import Goal
from app.models.session import StudySession
from app.models.study import Task
from app.schemas.goals import GoalCreate, GoalUpdate, GoalOut
from app.services.session_service import ensure_utc


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class GoalsService:
    @staticmethod
    def _enrich_goal(db: Session, goal: Goal) -> GoalOut:
        out = GoalOut.model_validate(goal)
        now = utc_now()

        # Compute period start date
        if goal.period == "daily":
            start_dt = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
        elif goal.period == "weekly":
            start_dt = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc) - timedelta(days=now.weekday())
        else:  # monthly
            start_dt = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=timezone.utc)

        current_value = 0
        if goal.goal_type in ["daily_time", "weekly_time", "monthly_time"]:
            completed_sessions = db.query(StudySession).filter(
                StudySession.user_id == goal.user_id,
                StudySession.status == "completed",
            ).all()
            total_sec = sum(
                s.actual_duration
                for s in completed_sessions
                if ensure_utc(s.started_at) and ensure_utc(s.started_at) >= start_dt
            )
            current_value = int(total_sec // 60)
        elif goal.goal_type == "tasks_completed":
            tasks = db.query(Task).filter(
                Task.user_id == goal.user_id,
                Task.status == "completed",
            ).all()
            current_value = sum(
                1 for t in tasks
                if ensure_utc(t.completed_at) and ensure_utc(t.completed_at) >= start_dt
            )

        out.current_value = current_value
        out.progress_percentage = min(100, int((current_value / goal.target_value) * 100)) if goal.target_value > 0 else 0
        return out

    @staticmethod
    def list_goals(db: Session, user_id: str) -> List[GoalOut]:
        goals = db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.status == "active",
        ).order_by(Goal.created_at.desc()).all()
        return [GoalsService._enrich_goal(db, g) for g in goals]

    @staticmethod
    def create_goal(db: Session, user_id: str, payload: GoalCreate) -> GoalOut:
        now = utc_now()
        goal = Goal(
            user_id=user_id,
            goal_type=payload.goal_type,
            target_value=payload.target_value,
            period=payload.period,
            start_date=ensure_utc(payload.start_date) or now,
            end_date=ensure_utc(payload.end_date),
            status="active",
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return GoalsService._enrich_goal(db, goal)

    @staticmethod
    def update_goal(db: Session, user_id: str, goal_id: str, payload: GoalUpdate) -> GoalOut:
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

        if payload.target_value is not None:
            goal.target_value = payload.target_value
        if payload.status is not None:
            goal.status = payload.status
        if payload.end_date is not None:
            goal.end_date = ensure_utc(payload.end_date)

        db.commit()
        db.refresh(goal)
        return GoalsService._enrich_goal(db, goal)

    @staticmethod
    def delete_goal(db: Session, user_id: str, goal_id: str) -> None:
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
        db.delete(goal)
        db.commit()
