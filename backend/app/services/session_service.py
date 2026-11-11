from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.session import StudySession
from app.models.technique import Technique
from app.models.study import Task, Subject
from app.schemas.session import StudySessionCreate, StudySessionComplete, StudySessionUpdate, StudySessionOut


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


class SessionService:
    @staticmethod
    def _enrich_session_out(s: StudySession) -> StudySessionOut:
        out = StudySessionOut.model_validate(s)
        if s.technique:
            out.technique_name = s.technique.name
            out.technique_slug = s.technique.slug
        if s.task:
            out.task_title = s.task.title
        if s.subject:
            out.subject_name = s.subject.name
            out.subject_colour = s.subject.colour
        return out

    @staticmethod
    def get_session(db: Session, user_id: str, session_id: str) -> StudySession:
        session = db.query(StudySession).filter(
            StudySession.id == session_id,
            StudySession.user_id == user_id
        ).first()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study session not found")
        return session

    @staticmethod
    def get_active_session(db: Session, user_id: str) -> Optional[StudySessionOut]:
        session = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.status.in_(["running", "paused"])
        ).order_by(StudySession.started_at.desc()).first()

        if not session:
            return None
        return SessionService._enrich_session_out(session)

    @staticmethod
    def start_session(db: Session, user_id: str, payload: StudySessionCreate) -> StudySessionOut:
        # Verify technique exists
        technique = db.query(Technique).filter(Technique.id == payload.technique_id).first()
        if not technique:
            # Also allow querying by slug
            technique = db.query(Technique).filter(Technique.slug == payload.technique_id).first()
            if not technique:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technique not found")

        # Validate task if provided
        subject_id = payload.subject_id
        if payload.task_id:
            task = db.query(Task).filter(Task.id == payload.task_id, Task.user_id == user_id).first()
            if not task:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
            if not subject_id and task.subject_id:
                subject_id = task.subject_id
            if task.status == "pending":
                task.status = "in_progress"

        # Validate subject if provided
        if subject_id:
            subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
            if not subject:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

        # Cancel any lingering active sessions for this user to guarantee single active session invariant
        lingering = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.status.in_(["running", "paused"])
        ).all()
        for old in lingering:
            old.status = "cancelled"
            old.ended_at = utc_now()

        # Create new session
        new_session = StudySession(
            user_id=user_id,
            technique_id=technique.id,
            task_id=payload.task_id,
            subject_id=subject_id,
            planned_duration=payload.planned_duration,
            actual_duration=0,
            started_at=utc_now(),
            paused_duration=0,
            status="running",
            notes=payload.notes,
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return SessionService._enrich_session_out(new_session)

    @staticmethod
    def pause_session(db: Session, user_id: str, session_id: str) -> StudySessionOut:
        session = SessionService.get_session(db, user_id, session_id)
        if session.status != "running":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot pause session in status '{session.status}'. Must be 'running'.",
            )

        session.status = "paused"
        session.paused_at = utc_now()
        db.commit()
        db.refresh(session)
        return SessionService._enrich_session_out(session)

    @staticmethod
    def resume_session(db: Session, user_id: str, session_id: str) -> StudySessionOut:
        session = SessionService.get_session(db, user_id, session_id)
        if session.status != "paused":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot resume session in status '{session.status}'. Must be 'paused'.",
            )

        if session.paused_at:
            paused_at_utc = ensure_utc(session.paused_at)
            delta = int((utc_now() - paused_at_utc).total_seconds())
            session.paused_duration += max(0, delta)
            session.paused_at = None

        session.status = "running"
        db.commit()
        db.refresh(session)
        return SessionService._enrich_session_out(session)

    @staticmethod
    def complete_session(
        db: Session,
        user_id: str,
        session_id: str,
        payload: Optional[StudySessionComplete] = None,
    ) -> StudySessionOut:
        session = SessionService.get_session(db, user_id, session_id)
        if session.status not in ["running", "paused"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot complete session in status '{session.status}'. Must be 'running' or 'paused'.",
            )

        now = utc_now()
        # If it was paused when completed, account for the final pause segment
        if session.status == "paused" and session.paused_at:
            paused_at_utc = ensure_utc(session.paused_at)
            pause_delta = int((now - paused_at_utc).total_seconds())
            session.paused_duration += max(0, pause_delta)
            session.paused_at = None

        session.ended_at = now
        started_at_utc = ensure_utc(session.started_at)
        total_elapsed = int((session.ended_at - started_at_utc).total_seconds())
        # Net actual focus duration (never negative)
        session.actual_duration = max(0, total_elapsed - session.paused_duration)
        session.status = "completed"

        if payload:
            if payload.concentration_rating is not None:
                session.concentration_rating = payload.concentration_rating
            if payload.notes is not None:
                session.notes = payload.notes.strip() if payload.notes else None

        db.commit()
        db.refresh(session)
        return SessionService._enrich_session_out(session)

    @staticmethod
    def cancel_session(db: Session, user_id: str, session_id: str) -> StudySessionOut:
        session = SessionService.get_session(db, user_id, session_id)
        if session.status not in ["running", "paused"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel session in status '{session.status}'.",
            )

        session.status = "cancelled"
        session.ended_at = utc_now()
        db.commit()
        db.refresh(session)
        return SessionService._enrich_session_out(session)

    @staticmethod
    def update_session(db: Session, user_id: str, session_id: str, payload: StudySessionUpdate) -> StudySessionOut:
        session = SessionService.get_session(db, user_id, session_id)
        if payload.notes is not None:
            session.notes = payload.notes.strip() if payload.notes else None
        if payload.concentration_rating is not None:
            session.concentration_rating = payload.concentration_rating
        db.commit()
        db.refresh(session)
        return SessionService._enrich_session_out(session)

    @staticmethod
    def list_history(
        db: Session,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> List[StudySessionOut]:
        sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.status.in_(["completed", "cancelled"])
        ).order_by(StudySession.started_at.desc()).offset(offset).limit(limit).all()
        return [SessionService._enrich_session_out(s) for s in sessions]
