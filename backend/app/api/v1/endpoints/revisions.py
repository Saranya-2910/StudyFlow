from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.revision import RevisionCreate, RevisionUpdate, RevisionComplete, RevisionOut
from app.services.auth_service import get_current_user
from app.services.revision_service import RevisionService

router = APIRouter(prefix="/revisions", tags=["Topic Revisions"])


@router.get("", response_model=List[RevisionOut])
def list_revisions(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all topic revisions for the user."""
    return RevisionService.list_revisions(db, current_user.id, status_filter)


@router.get("/upcoming", response_model=List[RevisionOut])
def get_upcoming_revisions(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve next upcoming scheduled revisions."""
    return RevisionService.get_upcoming_revisions(db, current_user.id, limit)


@router.post("", response_model=RevisionOut, status_code=status.HTTP_201_CREATED)
def schedule_revision(
    payload: RevisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Schedule a future topic revision session."""
    return RevisionService.create_revision(db, current_user.id, payload)


@router.post("/{revision_id}/complete", response_model=RevisionOut)
def complete_revision(
    revision_id: str,
    payload: RevisionComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a revision session completed with a recall rating."""
    return RevisionService.complete_revision(db, current_user.id, revision_id, payload)


@router.delete("/{revision_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_revision(
    revision_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    RevisionService.delete_revision(db, current_user.id, revision_id)
    return None
