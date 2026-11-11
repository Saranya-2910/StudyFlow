from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.session import StudySessionCreate, StudySessionComplete, StudySessionUpdate, StudySessionOut
from app.services.auth_service import get_current_user
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Study Sessions & Timers"])


@router.post("", response_model=StudySessionOut, status_code=status.HTTP_201_CREATED)
def start_session(
    payload: StudySessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start an authoritative study session with a selected technique and optional task/subject."""
    return SessionService.start_session(db, current_user.id, payload)


@router.get("/active", response_model=Optional[StudySessionOut])
def get_active_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch the currently running or paused session for this user to restore state after refresh."""
    return SessionService.get_active_session(db, current_user.id)


@router.get("/history", response_model=List[StudySessionOut])
def get_session_history(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve historical study sessions for the authenticated user."""
    return SessionService.list_history(db, current_user.id, limit=limit, offset=offset)


@router.get("/{session_id}", response_model=StudySessionOut)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single session details."""
    session = SessionService.get_session(db, current_user.id, session_id)
    return SessionService._enrich_session_out(session)


@router.post("/{session_id}/pause", response_model=StudySessionOut)
def pause_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pause an active study session."""
    return SessionService.pause_session(db, current_user.id, session_id)


@router.post("/{session_id}/resume", response_model=StudySessionOut)
def resume_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resume a paused study session, adding paused delta to paused_duration."""
    return SessionService.resume_session(db, current_user.id, session_id)


@router.post("/{session_id}/complete", response_model=StudySessionOut)
def complete_session(
    session_id: str,
    payload: Optional[StudySessionComplete] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Complete a session, calculate net focus duration, and record optional concentration rating."""
    return SessionService.complete_session(db, current_user.id, session_id, payload)


@router.post("/{session_id}/cancel", response_model=StudySessionOut)
def cancel_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a study session."""
    return SessionService.cancel_session(db, current_user.id, session_id)


@router.patch("/{session_id}", response_model=StudySessionOut)
def update_session(
    session_id: str,
    payload: StudySessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update session notes or concentration rating."""
    return SessionService.update_session(db, current_user.id, session_id, payload)
