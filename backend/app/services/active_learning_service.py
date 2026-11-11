from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.active_learning import FeynmanNote, BrainDumpSession, MindMap
from app.models.study import Topic
from app.schemas.active_learning import (
    FeynmanCreate,
    FeynmanUpdate,
    FeynmanOut,
    BrainDumpCreate,
    BrainDumpOut,
    MindMapCreate,
    MindMapUpdate,
    MindMapOut,
)


class ActiveLearningService:
    # ------------------ FEYNMAN ------------------ #
    @staticmethod
    def _enrich_feynman(note: FeynmanNote) -> FeynmanOut:
        out = FeynmanOut.model_validate(note)
        if note.topic:
            out.topic_title = note.topic.title
        return out

    @staticmethod
    def list_feynman(db: Session, user_id: str, topic_id: Optional[str] = None) -> List[FeynmanOut]:
        query = db.query(FeynmanNote).filter(FeynmanNote.user_id == user_id)
        if topic_id:
            query = query.filter(FeynmanNote.topic_id == topic_id)
        notes = query.order_by(FeynmanNote.updated_at.desc()).all()
        return [ActiveLearningService._enrich_feynman(n) for n in notes]

    @staticmethod
    def get_feynman(db: Session, user_id: str, note_id: str) -> FeynmanNote:
        note = db.query(FeynmanNote).filter(
            FeynmanNote.id == note_id,
            FeynmanNote.user_id == user_id,
        ).first()
        if not note:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feynman note not found")
        return note

    @staticmethod
    def create_feynman(db: Session, user_id: str, payload: FeynmanCreate) -> FeynmanOut:
        if payload.topic_id:
            topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
            if not topic:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

        note = FeynmanNote(
            user_id=user_id,
            concept_title=payload.concept_title.strip(),
            target_audience=payload.target_audience.strip() if payload.target_audience else "A 10-year old / complete beginner",
            explanation=payload.explanation.strip(),
            identified_gaps=payload.identified_gaps.strip() if payload.identified_gaps else None,
            simplified_analogy=payload.simplified_analogy.strip() if payload.simplified_analogy else None,
            topic_id=payload.topic_id,
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return ActiveLearningService._enrich_feynman(note)

    @staticmethod
    def update_feynman(db: Session, user_id: str, note_id: str, payload: FeynmanUpdate) -> FeynmanOut:
        note = ActiveLearningService.get_feynman(db, user_id, note_id)
        if payload.concept_title is not None:
            note.concept_title = payload.concept_title.strip()
        if payload.target_audience is not None:
            note.target_audience = payload.target_audience.strip()
        if payload.explanation is not None:
            note.explanation = payload.explanation.strip()
        if payload.identified_gaps is not None:
            note.identified_gaps = payload.identified_gaps.strip() if payload.identified_gaps else None
        if payload.simplified_analogy is not None:
            note.simplified_analogy = payload.simplified_analogy.strip() if payload.simplified_analogy else None
        if payload.topic_id is not None:
            if payload.topic_id:
                topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
                if not topic:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
                note.topic_id = payload.topic_id
            else:
                note.topic_id = None

        db.commit()
        db.refresh(note)
        return ActiveLearningService._enrich_feynman(note)

    @staticmethod
    def delete_feynman(db: Session, user_id: str, note_id: str) -> None:
        note = ActiveLearningService.get_feynman(db, user_id, note_id)
        db.delete(note)
        db.commit()

    # ------------------ BRAIN DUMP ------------------ #
    @staticmethod
    def _enrich_braindump(session: BrainDumpSession) -> BrainDumpOut:
        out = BrainDumpOut.model_validate(session)
        if session.topic:
            out.topic_title = session.topic.title
        return out

    @staticmethod
    def list_braindump(db: Session, user_id: str) -> List[BrainDumpOut]:
        sessions = db.query(BrainDumpSession).filter(
            BrainDumpSession.user_id == user_id
        ).order_by(BrainDumpSession.created_at.desc()).all()
        return [ActiveLearningService._enrich_braindump(s) for s in sessions]

    @staticmethod
    def get_braindump(db: Session, user_id: str, dump_id: str) -> BrainDumpSession:
        dump = db.query(BrainDumpSession).filter(
            BrainDumpSession.id == dump_id,
            BrainDumpSession.user_id == user_id,
        ).first()
        if not dump:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brain dump session not found")
        return dump

    @staticmethod
    def create_braindump(db: Session, user_id: str, payload: BrainDumpCreate) -> BrainDumpOut:
        if payload.topic_id:
            topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
            if not topic:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

        dump = BrainDumpSession(
            user_id=user_id,
            title=payload.title.strip(),
            content=payload.content.strip(),
            duration_seconds=payload.duration_seconds,
            knowledge_gaps=payload.knowledge_gaps.strip() if payload.knowledge_gaps else None,
            topic_id=payload.topic_id,
        )
        db.add(dump)
        db.commit()
        db.refresh(dump)
        return ActiveLearningService._enrich_braindump(dump)

    @staticmethod
    def delete_braindump(db: Session, user_id: str, dump_id: str) -> None:
        dump = ActiveLearningService.get_braindump(db, user_id, dump_id)
        db.delete(dump)
        db.commit()

    # ------------------ MIND MAPS ------------------ #
    @staticmethod
    def _enrich_mindmap(map_obj: MindMap) -> MindMapOut:
        out = MindMapOut.model_validate(map_obj)
        if map_obj.topic:
            out.topic_title = map_obj.topic.title
        return out

    @staticmethod
    def list_mindmaps(db: Session, user_id: str) -> List[MindMapOut]:
        maps = db.query(MindMap).filter(MindMap.user_id == user_id).order_by(MindMap.updated_at.desc()).all()
        return [ActiveLearningService._enrich_mindmap(m) for m in maps]

    @staticmethod
    def get_mindmap(db: Session, user_id: str, map_id: str) -> MindMap:
        map_obj = db.query(MindMap).filter(
            MindMap.id == map_id,
            MindMap.user_id == user_id,
        ).first()
        if not map_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mind map not found")
        return map_obj

    @staticmethod
    def create_mindmap(db: Session, user_id: str, payload: MindMapCreate) -> MindMapOut:
        if payload.topic_id:
            topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
            if not topic:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

        map_obj = MindMap(
            user_id=user_id,
            title=payload.title.strip(),
            graph_data=payload.graph_data or {
                "nodes": [
                    {"id": "root", "text": payload.title.strip(), "x": 0, "y": 0, "isRoot": True}
                ],
                "connections": [],
            },
            topic_id=payload.topic_id,
        )
        db.add(map_obj)
        db.commit()
        db.refresh(map_obj)
        return ActiveLearningService._enrich_mindmap(map_obj)

    @staticmethod
    def update_mindmap(db: Session, user_id: str, map_id: str, payload: MindMapUpdate) -> MindMapOut:
        map_obj = ActiveLearningService.get_mindmap(db, user_id, map_id)
        if payload.title is not None:
            map_obj.title = payload.title.strip()
        if payload.graph_data is not None:
            map_obj.graph_data = payload.graph_data
        if payload.topic_id is not None:
            if payload.topic_id:
                topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
                if not topic:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
                map_obj.topic_id = payload.topic_id
            else:
                map_obj.topic_id = None

        db.commit()
        db.refresh(map_obj)
        return ActiveLearningService._enrich_mindmap(map_obj)

    @staticmethod
    def delete_mindmap(db: Session, user_id: str, map_id: str) -> None:
        map_obj = ActiveLearningService.get_mindmap(db, user_id, map_id)
        db.delete(map_obj)
        db.commit()
