from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.flashcard import (
    FlashcardCreate,
    FlashcardUpdate,
    FlashcardReviewCreate,
    FlashcardOut,
    FlashcardDueSummary,
)
from app.services.auth_service import get_current_user
from app.services.flashcard_service import FlashcardService

router = APIRouter(prefix="/flashcards", tags=["Spaced Repetition & Flashcards"])


@router.get("", response_model=List[FlashcardOut])
def list_flashcards(
    subject_id: Optional[str] = None,
    topic_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all flashcards for the user, with optional subject/topic filters."""
    return FlashcardService.list_flashcards(db, current_user.id, subject_id, topic_id)


@router.get("/due", response_model=List[FlashcardOut])
def get_due_flashcards(
    subject_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve flashcards that are scheduled for review today or overdue."""
    return FlashcardService.get_due_flashcards(db, current_user.id, subject_id)


@router.get("/summary", response_model=FlashcardDueSummary)
def get_due_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return counts of due cards and subject breakdown."""
    return FlashcardService.get_due_summary(db, current_user.id)


@router.post("", response_model=FlashcardOut, status_code=status.HTTP_201_CREATED)
def create_flashcard(
    payload: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new flashcard with initial SM-2 parameters."""
    return FlashcardService.create_flashcard(db, current_user.id, payload)


@router.get("/{card_id}", response_model=FlashcardOut)
def get_flashcard(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = FlashcardService.get_flashcard(db, current_user.id, card_id)
    return FlashcardService._enrich_flashcard(card)


@router.patch("/{card_id}", response_model=FlashcardOut)
def update_flashcard(
    card_id: str,
    payload: FlashcardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return FlashcardService.update_flashcard(db, current_user.id, card_id, payload)


@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    FlashcardService.delete_flashcard(db, current_user.id, card_id)
    return None


@router.post("/{card_id}/review", response_model=FlashcardOut)
def review_flashcard(
    card_id: str,
    payload: FlashcardReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit recall rating (0-5) and calculate next SM-2 interval."""
    return FlashcardService.review_flashcard(db, current_user.id, card_id, payload)
