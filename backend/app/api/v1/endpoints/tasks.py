from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.study import TaskCreate, TaskUpdate, TaskOut
from app.services.auth_service import get_current_user
from app.services.study_service import StudyService

router = APIRouter(prefix="/tasks", tags=["Tasks Planner"])


@router.get("", response_model=List[TaskOut])
def get_tasks(
    status_filter: Optional[str] = None,
    subject_id: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all tasks for the user with optional filtering by status, subject, or priority."""
    return StudyService.list_tasks(
        db=db,
        user_id=current_user.id,
        status_filter=status_filter,
        subject_id=subject_id,
        priority=priority,
    )


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new task associated with an optional subject and topic."""
    return StudyService.create_task(db, current_user.id, payload)


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single task details."""
    task = StudyService.get_task(db, current_user.id, task_id)
    return StudyService._enrich_task_out(task)


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update task details or change status (e.g. mark as completed)."""
    return StudyService.update_task(db, current_user.id, task_id, payload)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a task."""
    StudyService.delete_task(db, current_user.id, task_id)
    return None
