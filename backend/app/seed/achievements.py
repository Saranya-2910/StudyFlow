"""Predefined verified achievement badges for StudyFlow."""

ACHIEVEMENTS_DATA = [
    {
        "name": "First Focus Sprint",
        "slug": "first-session",
        "description": "Completed your very first verified study session.",
        "icon": "zap",
        "criteria": {"type": "session_count", "threshold": 1},
    },
    {
        "name": "5 Focus Hours",
        "slug": "focus-5-hours",
        "description": "Logged 300+ minutes (5 hours) of focused study time.",
        "icon": "clock",
        "criteria": {"type": "total_minutes", "threshold": 300},
    },
    {
        "name": "Deep Work Master",
        "slug": "focus-25-hours",
        "description": "Accumulated 1,500+ minutes (25 hours) of dedicated focus.",
        "icon": "award",
        "criteria": {"type": "total_minutes", "threshold": 1500},
    },
    {
        "name": "Consistency Kickstart",
        "slug": "streak-3-days",
        "description": "Maintained an active study streak for 3 consecutive days.",
        "icon": "flame",
        "criteria": {"type": "streak_days", "threshold": 3},
    },
    {
        "name": "7-Day Habit Champion",
        "slug": "streak-7-days",
        "description": "Built an unbreakable 7-day study streak.",
        "icon": "trophy",
        "criteria": {"type": "streak_days", "threshold": 7},
    },
    {
        "name": "Recall Initiate",
        "slug": "flashcard-pioneer",
        "description": "Completed 10 spaced repetition flashcard reviews.",
        "icon": "layers",
        "criteria": {"type": "flashcard_reviews", "threshold": 10},
    },
    {
        "name": "Spaced Repetition Scholar",
        "slug": "flashcard-master",
        "description": "Mastered 50+ spaced repetition flashcard reviews.",
        "icon": "sparkles",
        "criteria": {"type": "flashcard_reviews", "threshold": 50},
    },
    {
        "name": "Task Destroyer",
        "slug": "task-crusher",
        "description": "Completed 10 academic tasks in your planner.",
        "icon": "check-circle",
        "criteria": {"type": "completed_tasks", "threshold": 10},
    },
]
