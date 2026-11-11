from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.study import SubjectCreate, SubjectUpdate, SubjectOut, TopicCreate, TopicOut
from app.services.auth_service import get_current_user
from app.services.study_service import StudyService

router = APIRouter(prefix="/subjects", tags=["Subjects & Topics"])


@router.get("", response_model=List[SubjectOut])
def get_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all study subjects belonging to the authenticated user."""
    return StudyService.list_subjects(db, current_user.id)


@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new subject with custom colour and description."""
    return StudyService.create_subject(db, current_user.id, payload)


@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single subject details."""
    sub = StudyService.get_subject(db, current_user.id, subject_id)
    return SubjectOut.model_validate(sub)


@router.patch("/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update subject name, description, or colour."""
    return StudyService.update_subject(db, current_user.id, subject_id, payload)


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete subject and all related topics/tasks."""
    StudyService.delete_subject(db, current_user.id, subject_id)
    return None


@router.get("/{subject_id}/topics", response_model=List[TopicOut])
def get_topics(
    subject_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all topics inside a specific subject."""
    return StudyService.list_topics(db, current_user.id, subject_id)


@router.post("/{subject_id}/topics", response_model=TopicOut, status_code=status.HTTP_201_CREATED)
def create_topic(
    subject_id: str,
    payload: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new topic within a subject."""
    return StudyService.create_topic(db, current_user.id, subject_id, payload)
