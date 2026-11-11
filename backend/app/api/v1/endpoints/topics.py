from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.study import TopicUpdate, TopicOut
from app.services.auth_service import get_current_user
from app.services.study_service import StudyService

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.patch("/{topic_id}", response_model=TopicOut)
def update_topic(
    topic_id: str,
    payload: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update topic title, difficulty, or completion status."""
    return StudyService.update_topic(db, current_user.id, topic_id, payload)


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_topic(
    topic_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a topic."""
    StudyService.delete_topic(db, current_user.id, topic_id)
    return None
