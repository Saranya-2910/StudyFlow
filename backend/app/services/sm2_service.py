from datetime import datetime, timedelta, timezone
from typing import Tuple


def calculate_sm2(
    quality_rating: int,
    repetitions: int,
    ease_factor: float,
    previous_interval: int,
) -> Tuple[int, float, int, datetime]:
    """
    SuperMemo-2 (SM-2) Spaced Repetition Algorithm.

    :param quality_rating: 0 (blackout) to 5 (perfect recall)
    :param repetitions: current consecutive successful recall count
    :param ease_factor: multiplier indicating difficulty (default 2.5)
    :param previous_interval: last interval in days
    :return: (next_interval_days, next_ease_factor, next_repetitions, next_review_at)
    """
    # 1. Update Ease Factor
    # EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    diff = 5 - quality_rating
    new_ease_factor = ease_factor + (0.1 - diff * (0.08 + diff * 0.02))
    # Minimum ease factor floor is 1.30
    if new_ease_factor < 1.30:
        new_ease_factor = 1.30

    # 2. Determine Repetitions & Interval
    if quality_rating < 3:
        # Failed recall - reset repetitions, review again tomorrow
        new_repetitions = 0
        new_interval = 1
    else:
        # Successful recall
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = max(1, round(previous_interval * new_ease_factor))
        new_repetitions = repetitions + 1

    next_review_at = datetime.now(timezone.utc) + timedelta(days=new_interval)
    return new_interval, round(new_ease_factor, 2), new_repetitions, next_review_at
