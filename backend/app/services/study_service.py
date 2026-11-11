from typing import List, Optional
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.study import Subject, Topic, Task
from app.models.session import StudySession
from app.schemas.study import (
    SubjectCreate,
    SubjectUpdate,
    SubjectOut,
    TopicCreate,
    TopicUpdate,
    TopicOut,
    TaskCreate,
    TaskUpdate,
    TaskOut,
)


class StudyService:
    # ------------------ SUBJECTS ------------------ #
    @staticmethod
    def list_subjects(db: Session, user_id: str) -> List[SubjectOut]:
        subjects = db.query(Subject).filter(Subject.user_id == user_id).order_by(Subject.name.asc()).all()
        result = []
        for s in subjects:
            tasks_count = db.query(func.count(Task.id)).filter(Task.subject_id == s.id, Task.user_id == user_id).scalar() or 0
            completed_tasks = db.query(func.count(Task.id)).filter(
                Task.subject_id == s.id,
                Task.user_id == user_id,
                Task.status == "completed"
            ).scalar() or 0
            total_seconds = db.query(func.sum(StudySession.actual_duration)).filter(
                StudySession.subject_id == s.id,
                StudySession.user_id == user_id,
                StudySession.status == "completed"
            ).scalar() or 0

            out = SubjectOut.model_validate(s)
            out.tasks_count = tasks_count
            out.completed_tasks_count = completed_tasks
            out.total_study_minutes = int(total_seconds // 60)
            result.append(out)
        return result

    @staticmethod
    def get_subject(db: Session, user_id: str, subject_id: str) -> Subject:
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        return subject

    @staticmethod
    def create_subject(db: Session, user_id: str, payload: SubjectCreate) -> SubjectOut:
        # Check duplicate name for same user
        existing = db.query(Subject).filter(
            Subject.user_id == user_id,
            func.lower(Subject.name) == payload.name.strip().lower()
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject '{payload.name.strip()}' already exists.",
            )

        subject = Subject(
            user_id=user_id,
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
            colour=payload.colour,
        )
        db.add(subject)
        db.commit()
        db.refresh(subject)
        out = SubjectOut.model_validate(subject)
        out.tasks_count = 0
        out.completed_tasks_count = 0
        out.total_study_minutes = 0
        return out

    @staticmethod
    def update_subject(db: Session, user_id: str, subject_id: str, payload: SubjectUpdate) -> SubjectOut:
        subject = StudyService.get_subject(db, user_id, subject_id)
        if payload.name is not None:
            name_clean = payload.name.strip()
            existing = db.query(Subject).filter(
                Subject.user_id == user_id,
                func.lower(Subject.name) == name_clean.lower(),
                Subject.id != subject_id,
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Another subject with the name '{name_clean}' already exists.",
                )
            subject.name = name_clean
        if payload.description is not None:
            subject.description = payload.description.strip() if payload.description else None
        if payload.colour is not None:
            subject.colour = payload.colour

        db.commit()
        db.refresh(subject)
        return SubjectOut.model_validate(subject)

    @staticmethod
    def delete_subject(db: Session, user_id: str, subject_id: str) -> None:
        subject = StudyService.get_subject(db, user_id, subject_id)
        db.delete(subject)
        db.commit()

    # ------------------ TOPICS ------------------ #
    @staticmethod
    def list_topics(db: Session, user_id: str, subject_id: str) -> List[TopicOut]:
        StudyService.get_subject(db, user_id, subject_id)
        topics = db.query(Topic).filter(
            Topic.subject_id == subject_id,
            Topic.user_id == user_id,
        ).order_by(Topic.created_at.asc()).all()
        return [TopicOut.model_validate(t) for t in topics]

    @staticmethod
    def create_topic(db: Session, user_id: str, subject_id: str, payload: TopicCreate) -> TopicOut:
        StudyService.get_subject(db, user_id, subject_id)
        topic = Topic(
            user_id=user_id,
            subject_id=subject_id,
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description else None,
            difficulty=payload.difficulty,
            estimated_duration=payload.estimated_duration,
            completion_status=payload.completion_status,
        )
        db.add(topic)
        db.commit()
        db.refresh(topic)
        return TopicOut.model_validate(topic)

    @staticmethod
    def update_topic(db: Session, user_id: str, topic_id: str, payload: TopicUpdate) -> TopicOut:
        topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
        if not topic:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

        if payload.title is not None:
            topic.title = payload.title.strip()
        if payload.description is not None:
            topic.description = payload.description.strip() if payload.description else None
        if payload.difficulty is not None:
            topic.difficulty = payload.difficulty
        if payload.estimated_duration is not None:
            topic.estimated_duration = payload.estimated_duration
        if payload.completion_status is not None:
            topic.completion_status = payload.completion_status

        db.commit()
        db.refresh(topic)
        return TopicOut.model_validate(topic)

    @staticmethod
    def delete_topic(db: Session, user_id: str, topic_id: str) -> None:
        topic = db.query(Topic).filter(Topic.id == topic_id, Topic.user_id == user_id).first()
        if not topic:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
        db.delete(topic)
        db.commit()

    # ------------------ TASKS ------------------ #
    @staticmethod
    def _enrich_task_out(task: Task) -> TaskOut:
        out = TaskOut.model_validate(task)
        if task.subject:
            out.subject_name = task.subject.name
            out.subject_colour = task.subject.colour
        if task.topic:
            out.topic_title = task.topic.title
        return out

    @staticmethod
    def list_tasks(
        db: Session,
        user_id: str,
        status_filter: Optional[str] = None,
        subject_id: Optional[str] = None,
        priority: Optional[str] = None,
    ) -> List[TaskOut]:
        query = db.query(Task).filter(Task.user_id == user_id)
        if status_filter:
            query = query.filter(Task.status == status_filter)
        if subject_id:
            query = query.filter(Task.subject_id == subject_id)
        if priority:
            query = query.filter(Task.priority == priority)

        tasks = query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).all()
        return [StudyService._enrich_task_out(t) for t in tasks]

    @staticmethod
    def get_task(db: Session, user_id: str, task_id: str) -> Task:
        task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    @staticmethod
    def create_task(db: Session, user_id: str, payload: TaskCreate) -> TaskOut:
        if payload.subject_id:
            StudyService.get_subject(db, user_id, payload.subject_id)
        if payload.topic_id:
            topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
            if not topic:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

        task = Task(
            user_id=user_id,
            subject_id=payload.subject_id,
            topic_id=payload.topic_id,
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description else None,
            priority=payload.priority,
            due_date=payload.due_date,
            estimated_duration=payload.estimated_duration,
            status=payload.status,
            completed_at=datetime.now(timezone.utc) if payload.status == "completed" else None,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return StudyService._enrich_task_out(task)

    @staticmethod
    def update_task(db: Session, user_id: str, task_id: str, payload: TaskUpdate) -> TaskOut:
        task = StudyService.get_task(db, user_id, task_id)

        if payload.subject_id is not None:
            if payload.subject_id:
                StudyService.get_subject(db, user_id, payload.subject_id)
                task.subject_id = payload.subject_id
            else:
                task.subject_id = None

        if payload.topic_id is not None:
            if payload.topic_id:
                topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
                if not topic:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
                task.topic_id = payload.topic_id
            else:
                task.topic_id = None

        if payload.title is not None:
            task.title = payload.title.strip()
        if payload.description is not None:
            task.description = payload.description.strip() if payload.description else None
        if payload.priority is not None:
            task.priority = payload.priority
        if payload.due_date is not None:
            task.due_date = payload.due_date
        if payload.estimated_duration is not None:
            task.estimated_duration = payload.estimated_duration

        if payload.status is not None:
            if payload.status == "completed" and task.status != "completed":
                task.completed_at = datetime.now(timezone.utc)
            elif payload.status != "completed" and task.status == "completed":
                task.completed_at = None
            task.status = payload.status

        db.commit()
        db.refresh(task)
        return StudyService._enrich_task_out(task)

    @staticmethod
    def delete_task(db: Session, user_id: str, task_id: str) -> None:
        task = StudyService.get_task(db, user_id, task_id)
        db.delete(task)
        db.commit()
