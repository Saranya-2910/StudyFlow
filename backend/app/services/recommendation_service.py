from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.study import Task
from app.models.flashcard import Flashcard
from app.models.session import StudySession
from app.services.session_service import ensure_utc, utc_now


class RecommendationService:
    @staticmethod
    def get_study_recommendations(db: Session, user_id: str) -> List[Dict[str, Any]]:
        """
        Personalized study & technique recommendation engine.
        Operates deterministically using cognitive science rules based on the user's actual database state.
        Modular architecture allows optional external LLM provider if configured.
        """
        recommendations = []
        now = utc_now()

        # 1. Check for urgent/high-priority tasks
        urgent_tasks = db.query(Task).filter(
            Task.user_id == user_id,
            Task.status.in_(["pending", "in_progress"]),
            Task.priority.in_(["urgent", "high"]),
        ).all()

        if urgent_tasks:
            top_task = urgent_tasks[0]
            recommendations.append({
                "title": f"Tackle High-Impact Task: {top_task.title}",
                "technique_slug": "eat-the-frog",
                "technique_name": "Eat the Frog",
                "reason": "You have high-priority tasks in your planner. Cognitive research shows addressing your most daunting task first generates immense momentum and prevents avoidance.",
                "suggested_duration_minutes": 50,
                "task_id": top_task.id,
            })

        # 2. Check for due flashcards
        due_cards_count = db.query(func.count(Flashcard.id)).filter(
            Flashcard.user_id == user_id,
            Flashcard.next_review_at <= now,
        ).scalar() or 0

        if due_cards_count > 0:
            recommendations.append({
                "title": f"Spaced Repetition: {due_cards_count} Cards Overdue",
                "technique_slug": "spaced-repetition",
                "technique_name": "Spaced Repetition Review",
                "reason": "Reviewing flashcards right as they reach their forgetting threshold cements memory traces with minimal study effort.",
                "suggested_duration_minutes": 15,
            })

        # 3. Analyze session history
        completed_sessions = db.query(StudySession).filter(
            StudySession.user_id == user_id,
            StudySession.status == "completed",
        ).all()

        if not completed_sessions:
            # First-time user recommendation
            recommendations.append({
                "title": "Start with a Gentle 25-Minute Sprint",
                "technique_slug": "pomodoro",
                "technique_name": "Pomodoro Technique",
                "reason": "The 25-minute Pomodoro rhythm provides the ideal low-friction entry point to establish your study flow without cognitive overload.",
                "suggested_duration_minutes": 25,
            })
        else:
            # Check subject diversity for interleaving
            distinct_subjects = {s.subject_id for s in completed_sessions if s.subject_id}
            if len(distinct_subjects) >= 2:
                recommendations.append({
                    "title": "Sharpen Adaptability with Interleaving",
                    "technique_slug": "interleaving",
                    "technique_name": "Interleaved Study",
                    "reason": "Alternating between multiple course subjects prevents habituation and trains conceptual discrimination.",
                    "suggested_duration_minutes": 50,
                })
            else:
                recommendations.append({
                    "title": "Deep Immersion Sprint",
                    "technique_slug": "deep-work",
                    "technique_name": "Deep Work",
                    "reason": "A distraction-free 60-minute immersion allows you to reach a state of flow for complex conceptual problem-solving.",
                    "suggested_duration_minutes": 60,
                })

        return recommendations
