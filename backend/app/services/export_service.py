import csv
import io
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.session import StudySession
from app.models.technique import Technique
from app.models.study import Subject, Task
from app.services.session_service import ensure_utc


class ExportService:
    @staticmethod
    def export_sessions_csv(db: Session, user_id: str) -> str:
        """Export study session history as a downloadable CSV formatted string."""
        sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
        ).order_by(StudySession.started_at.desc()).all()

        tech_map = {t.id: t.name for t in db.query(Technique).all()}
        subj_map = {s.id: s.name for s in db.query(Subject).filter(Subject.user_id == user_id).all()}
        task_map = {t.id: t.title for t in db.query(Task).filter(Task.user_id == user_id).all()}

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Session ID",
            "Technique",
            "Subject",
            "Task",
            "Started At (UTC)",
            "Ended At (UTC)",
            "Planned Duration (Minutes)",
            "Actual Focus (Minutes)",
            "Status",
            "Concentration Rating (1-5)",
            "Notes",
        ])

        for s in sessions:
            started = ensure_utc(s.started_at).isoformat() if s.started_at else ""
            ended = ensure_utc(s.ended_at).isoformat() if s.ended_at else ""
            writer.writerow([
                s.id,
                tech_map.get(s.technique_id, "Unknown"),
                subj_map.get(s.subject_id, "General"),
                task_map.get(s.task_id, ""),
                started,
                ended,
                round(s.planned_duration / 60, 1),
                round(s.actual_duration / 60, 1),
                s.status,
                s.concentration_rating or "",
                s.notes or "",
            ])

        return output.getvalue()
