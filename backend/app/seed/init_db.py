import logging
from sqlalchemy.orm import Session
from app.models.technique import Technique
from app.models.goals import Achievement
from app.seed.techniques import TECHNIQUES_DATA
from app.seed.achievements import ACHIEVEMENTS_DATA

logger = logging.getLogger(__name__)


def seed_techniques(db: Session) -> None:
    """Seed technique library into the database if missing."""
    count = 0
    for tech_data in TECHNIQUES_DATA:
        existing = db.query(Technique).filter(Technique.slug == tech_data["slug"]).first()
        if not existing:
            technique = Technique(
                name=tech_data["name"],
                slug=tech_data["slug"],
                category=tech_data["category"],
                description=tech_data["description"],
                instructions=tech_data["instructions"],
                default_configuration=tech_data["default_configuration"],
                is_active=True,
            )
            db.add(technique)
            count += 1
        else:
            existing.name = tech_data["name"]
            existing.category = tech_data["category"]
            existing.description = tech_data["description"]
            existing.instructions = tech_data["instructions"]
            existing.default_configuration = tech_data["default_configuration"]

    db.commit()
    if count > 0:
        logger.info(f"Seeded {count} new study techniques into database.")


def seed_achievements(db: Session) -> None:
    """Seed achievement badges into the database if missing."""
    count = 0
    for ach_data in ACHIEVEMENTS_DATA:
        existing = db.query(Achievement).filter(Achievement.slug == ach_data["slug"]).first()
        if not existing:
            ach = Achievement(
                name=ach_data["name"],
                slug=ach_data["slug"],
                description=ach_data["description"],
                icon=ach_data["icon"],
                criteria=ach_data["criteria"],
            )
            db.add(ach)
            count += 1
        else:
            existing.name = ach_data["name"]
            existing.description = ach_data["description"]
            existing.icon = ach_data["icon"]
            existing.criteria = ach_data["criteria"]

    db.commit()
    if count > 0:
        logger.info(f"Seeded {count} new achievements into database.")
