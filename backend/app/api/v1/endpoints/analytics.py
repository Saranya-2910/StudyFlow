from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsOverviewOut
from app.services.auth_service import get_current_user
from app.services.analytics_service import AnalyticsService
from app.services.recommendation_service import RecommendationService
from app.services.export_service import ExportService

router = APIRouter(prefix="/analytics", tags=["Productivity Analytics"])


@router.get("/overview", response_model=AnalyticsOverviewOut)
def get_analytics_overview(
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve comprehensive analytics on study trends, technique breakdowns, and recall retention."""
    return AnalyticsService.get_overview(db, current_user.id, days=days)


@router.get("/recommendations", response_model=List[Dict[str, Any]])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dynamic, personalized study recommendations based on planner tasks and past focus rhythm."""
    return RecommendationService.get_study_recommendations(db, current_user.id)


@router.get("/export")
def export_study_history_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download study session records as a formatted CSV file."""
    csv_data = ExportService.export_sessions_csv(db, current_user.id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=studyflow-history.csv"},
    )
