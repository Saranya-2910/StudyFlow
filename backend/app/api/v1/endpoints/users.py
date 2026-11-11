from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import UserOut, UserUpdate, UserPreferencesOut, UserPreferencesUpdate
from app.models.user import User, UserPreferences
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/users", tags=["Users & Preferences"])


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Fetch current user profile and preferences."""
    return current_user


@router.patch("/me", response_model=UserOut)
def update_current_user(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profile information for the authenticated user."""
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.timezone is not None:
        current_user.timezone = payload.timezone
    if payload.profile_picture is not None:
        current_user.profile_picture = payload.profile_picture

    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/preferences", response_model=UserPreferencesOut)
def update_preferences(
    payload: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update study habits, target minutes, and notification preferences."""
    prefs = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.add(prefs)

    if payload.theme is not None:
        prefs.theme = payload.theme
    if payload.daily_goal_minutes is not None:
        prefs.daily_goal_minutes = payload.daily_goal_minutes
    if payload.default_focus_duration is not None:
        prefs.default_focus_duration = payload.default_focus_duration
    if payload.default_break_duration is not None:
        prefs.default_break_duration = payload.default_break_duration
    if payload.sound_enabled is not None:
        prefs.sound_enabled = payload.sound_enabled
    if payload.notifications_enabled is not None:
        prefs.notifications_enabled = payload.notifications_enabled

    db.commit()
    db.refresh(prefs)
    return prefs
