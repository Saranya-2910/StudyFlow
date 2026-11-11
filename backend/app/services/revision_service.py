from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.revision import Revision
from app.models.study import Topic, Subject
from app.schemas.revision import RevisionCreate, RevisionUpdate, RevisionComplete, RevisionOut
from app.services.session_service import ensure_utc


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RevisionService:
    @staticmethod
    def _enrich_revision(db: Session, rev: Revision) -> RevisionOut:
        out = RevisionOut.model_validate(rev)
        topic = db.query(Topic).filter(Topic.id == rev.topic_id).first()
        if topic:
            out.topic_title = topic.title
            out.subject_id = topic.subject_id
            subj = db.query(Subject).filter(Subject.id == topic.subject_id).first()
            if subj:
                out.subject_name = subj.name
                out.subject_colour = subj.colour
        return out

    @staticmethod
    def list_revisions(
        db: Session,
        user_id: str,
        status_filter: Optional[str] = None,
    ) -> List[RevisionOut]:
        query = db.query(Revision).filter(Revision.user_id == user_id)
        if status_filter:
            query = query.filter(Revision.status == status_filter)
        revisions = query.order_by(Revision.scheduled_at.asc()).all()
        return [RevisionService._enrich_revision(db, r) for r in revisions]

    @staticmethod
    def get_upcoming_revisions(db: Session, user_id: str, limit: int = 10) -> List[RevisionOut]:
        now = utc_now()
        revisions = db.query(Revision).filter(
            Revision.user_id == user_id,
            Revision.status == "scheduled",
        ).order_by(Revision.scheduled_at.asc()).limit(limit).all()
        return [RevisionService._enrich_revision(db, r) for r in revisions]

    @staticmethod
    def create_revision(db: Session, user_id: str, payload: RevisionCreate) -> RevisionOut:
        topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
        if not topic:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

        rev = Revision(
            user_id=user_id,
            topic_id=payload.topic_id,
            scheduled_at=ensure_utc(payload.scheduled_at),
            notes=payload.notes.strip() if payload.notes else None,
            status="scheduled",
        )
        db.add(rev)
        db.commit()
        db.refresh(rev)
        return RevisionService._enrich_revision(db, rev)

    @staticmethod
    def complete_revision(
        db: Session,
        user_id: str,
        revision_id: str,
        payload: RevisionComplete,
    ) -> RevisionOut:
        rev = db.query(Revision).filter(
            Revision.id == revision_id,
            Revision.user_id == user_id,
        ).first()
        if not rev:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision schedule not found")

        rev.status = "completed"
        rev.completed_at = utc_now()
        rev.recall_rating = payload.recall_rating
        if payload.notes:
            rev.notes = payload.notes.strip()

        db.commit()
        db.refresh(rev)
        return RevisionService._enrich_revision(db, rev)

    @staticmethod
    def delete_revision(db: Session, user_id: str, revision_id: str) -> None:
        rev = db.query(Revision).filter(
            Revision.id == revision_id,
            Revision.user_id == user_id,
        ).first()
        if not rev:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision schedule not found")
        db.delete(rev)
        db.commit()
