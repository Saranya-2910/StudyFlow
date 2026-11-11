from typing import List, Optional, Dict
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.flashcard import Flashcard, FlashcardReview
from app.models.study import Subject, Topic
from app.schemas.flashcard import (
    FlashcardCreate,
    FlashcardUpdate,
    FlashcardReviewCreate,
    FlashcardOut,
    FlashcardDueSummary,
)
from app.services.sm2_service import calculate_sm2


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class FlashcardService:
    @staticmethod
    def _enrich_flashcard(card: Flashcard) -> FlashcardOut:
        out = FlashcardOut.model_validate(card)
        if hasattr(card, "subject") and card.subject:
            out.subject_name = card.subject.name
            out.subject_colour = card.subject.colour
        if hasattr(card, "topic") and card.topic:
            out.topic_title = card.topic.title
        return out

    @staticmethod
    def list_flashcards(
        db: Session,
        user_id: str,
        subject_id: Optional[str] = None,
        topic_id: Optional[str] = None,
    ) -> List[FlashcardOut]:
        query = db.query(Flashcard).filter(Flashcard.user_id == user_id)
        if subject_id:
            query = query.filter(Flashcard.subject_id == subject_id)
        if topic_id:
            query = query.filter(Flashcard.topic_id == topic_id)

        cards = query.order_by(Flashcard.next_review_at.asc()).all()

        # Pre-fetch subjects and topics to enrich
        subj_map = {s.id: s for s in db.query(Subject).filter(Subject.user_id == user_id).all()}
        topic_map = {t.id: t for t in db.query(Topic).filter(Topic.user_id == user_id).all()}

        result = []
        for c in cards:
            out = FlashcardOut.model_validate(c)
            if c.subject_id in subj_map:
                out.subject_name = subj_map[c.subject_id].name
                out.subject_colour = subj_map[c.subject_id].colour
            if c.topic_id in topic_map:
                out.topic_title = topic_map[c.topic_id].title
            result.append(out)
        return result

    @staticmethod
    def get_due_flashcards(
        db: Session,
        user_id: str,
        subject_id: Optional[str] = None,
    ) -> List[FlashcardOut]:
        now = utc_now()
        query = db.query(Flashcard).filter(
            Flashcard.user_id == user_id,
            Flashcard.next_review_at <= now,
        )
        if subject_id:
            query = query.filter(Flashcard.subject_id == subject_id)

        cards = query.order_by(Flashcard.next_review_at.asc()).all()
        subj_map = {s.id: s for s in db.query(Subject).filter(Subject.user_id == user_id).all()}
        topic_map = {t.id: t for t in db.query(Topic).filter(Topic.user_id == user_id).all()}

        result = []
        for c in cards:
            out = FlashcardOut.model_validate(c)
            if c.subject_id in subj_map:
                out.subject_name = subj_map[c.subject_id].name
                out.subject_colour = subj_map[c.subject_id].colour
            if c.topic_id in topic_map:
                out.topic_title = topic_map[c.topic_id].title
            result.append(out)
        return result

    @staticmethod
    def get_due_summary(db: Session, user_id: str) -> FlashcardDueSummary:
        now = utc_now()
        total_count = db.query(func.count(Flashcard.id)).filter(Flashcard.user_id == user_id).scalar() or 0
        due_cards = db.query(Flashcard).filter(
            Flashcard.user_id == user_id,
            Flashcard.next_review_at <= now,
        ).all()

        subj_map = {s.id: s.name for s in db.query(Subject).filter(Subject.user_id == user_id).all()}
        breakdown: Dict[str, int] = {}
        for c in due_cards:
            name = subj_map.get(c.subject_id, "General")
            breakdown[name] = breakdown.get(name, 0) + 1

        return FlashcardDueSummary(
            due_count=len(due_cards),
            total_count=total_count,
            subject_due_breakdown=breakdown,
        )

    @staticmethod
    def get_flashcard(db: Session, user_id: str, card_id: str) -> Flashcard:
        card = db.query(Flashcard).filter(
            Flashcard.id == card_id,
            Flashcard.user_id == user_id,
        ).first()
        if not card:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")
        return card

    @staticmethod
    def create_flashcard(db: Session, user_id: str, payload: FlashcardCreate) -> FlashcardOut:
        # Validate subject
        subject = db.query(Subject).filter(Subject.id == payload.subject_id, Subject.user_id == user_id).first()
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

        # Validate topic if provided
        topic_title = None
        if payload.topic_id:
            topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
            if not topic:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
            topic_title = topic.title

        card = Flashcard(
            user_id=user_id,
            subject_id=payload.subject_id,
            topic_id=payload.topic_id,
            question=payload.question.strip(),
            answer=payload.answer.strip(),
            next_review_at=utc_now(),
            interval_days=1,
            ease_factor=2.50,
            repetitions=0,
        )
        db.add(card)
        db.commit()
        db.refresh(card)

        out = FlashcardOut.model_validate(card)
        out.subject_name = subject.name
        out.subject_colour = subject.colour
        out.topic_title = topic_title
        return out

    @staticmethod
    def update_flashcard(db: Session, user_id: str, card_id: str, payload: FlashcardUpdate) -> FlashcardOut:
        card = FlashcardService.get_flashcard(db, user_id, card_id)

        if payload.subject_id is not None:
            subject = db.query(Subject).filter(Subject.id == payload.subject_id, Subject.user_id == user_id).first()
            if not subject:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
            card.subject_id = payload.subject_id

        if payload.topic_id is not None:
            if payload.topic_id:
                topic = db.query(Topic).filter(Topic.id == payload.topic_id, Topic.user_id == user_id).first()
                if not topic:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
                card.topic_id = payload.topic_id
            else:
                card.topic_id = None

        if payload.question is not None:
            card.question = payload.question.strip()
        if payload.answer is not None:
            card.answer = payload.answer.strip()

        db.commit()
        db.refresh(card)

        subj = db.query(Subject).filter(Subject.id == card.subject_id).first()
        topic = db.query(Topic).filter(Topic.id == card.topic_id).first() if card.topic_id else None

        out = FlashcardOut.model_validate(card)
        if subj:
            out.subject_name = subj.name
            out.subject_colour = subj.colour
        if topic:
            out.topic_title = topic.title
        return out

    @staticmethod
    def delete_flashcard(db: Session, user_id: str, card_id: str) -> None:
        card = FlashcardService.get_flashcard(db, user_id, card_id)
        db.delete(card)
        db.commit()

    @staticmethod
    def review_flashcard(
        db: Session,
        user_id: str,
        card_id: str,
        payload: FlashcardReviewCreate,
    ) -> FlashcardOut:
        card = FlashcardService.get_flashcard(db, user_id, card_id)

        previous_interval = card.interval_days
        new_interval, new_ease, new_reps, next_review = calculate_sm2(
            quality_rating=payload.quality_rating,
            repetitions=card.repetitions,
            ease_factor=card.ease_factor,
            previous_interval=previous_interval,
        )

        # Log review
        review = FlashcardReview(
            flashcard_id=card.id,
            user_id=user_id,
            quality_rating=payload.quality_rating,
            reviewed_at=utc_now(),
            previous_interval=previous_interval,
            next_interval=new_interval,
        )
        db.add(review)

        # Update card with new SM-2 schedule
        card.interval_days = new_interval
        card.ease_factor = new_ease
        card.repetitions = new_reps
        card.next_review_at = next_review

        db.commit()
        db.refresh(card)

        subj = db.query(Subject).filter(Subject.id == card.subject_id).first()
        topic = db.query(Topic).filter(Topic.id == card.topic_id).first() if card.topic_id else None

        out = FlashcardOut.model_validate(card)
        if subj:
            out.subject_name = subj.name
            out.subject_colour = subj.colour
        if topic:
            out.topic_title = topic.title
        return out
