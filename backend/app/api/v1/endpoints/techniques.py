from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.technique import Technique, UserFavouriteTechnique
from app.models.user import User
from app.schemas.technique import TechniqueOut, TechniqueDetailOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/techniques", tags=["Techniques Library"])


@router.get("", response_model=List[TechniqueOut])
def list_techniques(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all available study techniques with user favourite status."""
    query = db.query(Technique).filter(Technique.is_active == True)
    if category:
        query = query.filter(Technique.category == category)

    techniques = query.order_by(Technique.category.asc(), Technique.name.asc()).all()

    # Get user favourite ids
    fav_ids = {
        fav.technique_id
        for fav in db.query(UserFavouriteTechnique.technique_id).filter(
            UserFavouriteTechnique.user_id == current_user.id
        ).all()
    }

    result = []
    for t in techniques:
        out = TechniqueOut.model_validate(t)
        out.is_favourite = t.id in fav_ids
        result.append(out)

    return result


@router.get("/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    """Return all unique technique categories."""
    categories = db.query(Technique.category).filter(Technique.is_active == True).distinct().all()
    return [c[0] for c in categories]


@router.get("/{id_or_slug}", response_model=TechniqueDetailOut)
def get_technique(
    id_or_slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single technique by UUID or slug."""
    technique = db.query(Technique).filter(
        (Technique.id == id_or_slug) | (Technique.slug == id_or_slug)
    ).first()
    if not technique:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technique not found")

    is_fav = db.query(UserFavouriteTechnique).filter(
        UserFavouriteTechnique.user_id == current_user.id,
        UserFavouriteTechnique.technique_id == technique.id,
    ).first() is not None

    out = TechniqueDetailOut.model_validate(technique)
    out.is_favourite = is_fav
    return out


@router.post("/{technique_id}/favourite", status_code=status.HTTP_201_CREATED)
def add_favourite(
    technique_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bookmark a technique as favourite."""
    technique = db.query(Technique).filter(
        (Technique.id == technique_id) | (Technique.slug == technique_id)
    ).first()
    if not technique:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technique not found")

    existing = db.query(UserFavouriteTechnique).filter(
        UserFavouriteTechnique.user_id == current_user.id,
        UserFavouriteTechnique.technique_id == technique.id,
    ).first()
    if not existing:
        fav = UserFavouriteTechnique(user_id=current_user.id, technique_id=technique.id)
        db.add(fav)
        db.commit()

    return {"message": "Technique bookmarked as favourite"}


@router.delete("/{technique_id}/favourite", status_code=status.HTTP_200_OK)
def remove_favourite(
    technique_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove technique from favourites."""
    technique = db.query(Technique).filter(
        (Technique.id == technique_id) | (Technique.slug == technique_id)
    ).first()
    if not technique:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technique not found")

    db.query(UserFavouriteTechnique).filter(
        UserFavouriteTechnique.user_id == current_user.id,
        UserFavouriteTechnique.technique_id == technique.id,
    ).delete()
    db.commit()
    return {"message": "Technique removed from favourites"}
