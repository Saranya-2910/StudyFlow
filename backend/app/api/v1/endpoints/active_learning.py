from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
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
from app.services.auth_service import get_current_user
from app.services.active_learning_service import ActiveLearningService

router = APIRouter(prefix="/learning", tags=["Active Learning Tools"])


# ------------------ FEYNMAN ------------------ #
@router.get("/feynman", response_model=List[FeynmanOut])
def list_feynman_notes(
    topic_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all saved Feynman concept explanations for the user."""
    return ActiveLearningService.list_feynman(db, current_user.id, topic_id=topic_id)


@router.post("/feynman", response_model=FeynmanOut, status_code=status.HTTP_201_CREATED)
def create_feynman_note(
    payload: FeynmanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a new Feynman technique breakdown."""
    return ActiveLearningService.create_feynman(db, current_user.id, payload)


@router.get("/feynman/{note_id}", response_model=FeynmanOut)
def get_feynman_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = ActiveLearningService.get_feynman(db, current_user.id, note_id)
    return ActiveLearningService._enrich_feynman(note)


@router.patch("/feynman/{note_id}", response_model=FeynmanOut)
def update_feynman_note(
    note_id: str,
    payload: FeynmanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ActiveLearningService.update_feynman(db, current_user.id, note_id, payload)


@router.delete("/feynman/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feynman_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ActiveLearningService.delete_feynman(db, current_user.id, note_id)
    return None


# ------------------ BRAIN DUMP ------------------ #
@router.get("/brain-dump", response_model=List[BrainDumpOut])
def list_braindump_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List historical brain dump free-recall sessions."""
    return ActiveLearningService.list_braindump(db, current_user.id)


@router.post("/brain-dump", response_model=BrainDumpOut, status_code=status.HTTP_201_CREATED)
def create_braindump_session(
    payload: BrainDumpCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save completed brain dump session with identified knowledge gaps."""
    return ActiveLearningService.create_braindump(db, current_user.id, payload)


@router.get("/brain-dump/{dump_id}", response_model=BrainDumpOut)
def get_braindump_session(
    dump_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dump = ActiveLearningService.get_braindump(db, current_user.id, dump_id)
    return ActiveLearningService._enrich_braindump(dump)


@router.delete("/brain-dump/{dump_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_braindump_session(
    dump_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ActiveLearningService.delete_braindump(db, current_user.id, dump_id)
    return None


# ------------------ MIND MAPS ------------------ #
@router.get("/mind-maps", response_model=List[MindMapOut])
def list_mind_maps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all mind maps for the current user."""
    return ActiveLearningService.list_mindmaps(db, current_user.id)


@router.post("/mind-maps", response_model=MindMapOut, status_code=status.HTTP_201_CREATED)
def create_mind_map(
    payload: MindMapCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new visual mind map with initial node tree."""
    return ActiveLearningService.create_mindmap(db, current_user.id, payload)


@router.get("/mind-maps/{map_id}", response_model=MindMapOut)
def get_mind_map(
    map_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    map_obj = ActiveLearningService.get_mindmap(db, current_user.id, map_id)
    return ActiveLearningService._enrich_mindmap(map_obj)


@router.patch("/mind-maps/{map_id}", response_model=MindMapOut)
def update_mind_map(
    map_id: str,
    payload: MindMapUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Persist mind map title or updated graph node data."""
    return ActiveLearningService.update_mindmap(db, current_user.id, map_id, payload)


@router.delete("/mind-maps/{map_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mind_map(
    map_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ActiveLearningService.delete_mindmap(db, current_user.id, map_id)
    return None
