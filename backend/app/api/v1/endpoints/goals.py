from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.goals import GoalCreate, GoalUpdate, GoalOut, AchievementOut
from app.services.auth_service import get_current_user
from app.services.goals_service import GoalsService
from app.services.achievement_service import AchievementService

router = APIRouter(tags=["Goals & Achievements"])


@router.get("/goals", response_model=List[GoalOut])
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve active goals with dynamically calculated progress."""
    return GoalsService.list_goals(db, current_user.id)


@router.post("/goals", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new study goal (e.g. 500 focus minutes weekly, 15 tasks completed)."""
    return GoalsService.create_goal(db, current_user.id, payload)


@router.patch("/goals/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: str,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return GoalsService.update_goal(db, current_user.id, goal_id, payload)


@router.delete("/goals/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    GoalsService.delete_goal(db, current_user.id, goal_id)
    return None


@router.get("/achievements", response_model=List[AchievementOut])
def list_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all achievement badges, automatically unlocking newly verified milestones."""
    return AchievementService.list_achievements(db, current_user.id)
