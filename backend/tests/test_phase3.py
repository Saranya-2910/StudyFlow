from datetime import datetime, timezone, timedelta


def test_revisions_workflow(client, test_user):
    # 1. Create subject & topic
    s_res = client.post("/api/v1/subjects", headers=test_user["headers"], json={"name": "History"})
    subj_id = s_res.json()["id"]

    t_res = client.post(
        f"/api/v1/subjects/{subj_id}/topics",
        headers=test_user["headers"],
        json={"title": "Industrial Revolution"},
    )
    topic_id = t_res.json()["id"]

    # 2. Schedule revision
    future_date = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    rev_res = client.post(
        "/api/v1/revisions",
        headers=test_user["headers"],
        json={
            "topic_id": topic_id,
            "scheduled_at": future_date,
            "notes": "Review steam engine inventions",
        },
    )
    assert rev_res.status_code == 201
    rev = rev_res.json()
    assert rev["status"] == "scheduled"
    assert rev["topic_title"] == "Industrial Revolution"
    rev_id = rev["id"]

    # 3. List upcoming
    up_res = client.get("/api/v1/revisions/upcoming", headers=test_user["headers"])
    assert up_res.status_code == 200
    assert len(up_res.json()) >= 1

    # 4. Complete revision with rating
    comp_res = client.post(
        f"/api/v1/revisions/{rev_id}/complete",
        headers=test_user["headers"],
        json={"recall_rating": 4, "notes": "Solid understanding"},
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"
    assert comp_res.json()["recall_rating"] == 4


def test_goals_and_achievements_engine(client, test_user):
    # 1. Check initial achievements: all should be locked for fresh user
    ach_res = client.get("/api/v1/achievements", headers=test_user["headers"])
    assert ach_res.status_code == 200
    achievements = ach_res.json()
    assert len(achievements) >= 8
    first_session_badge = next(a for a in achievements if a["slug"] == "first-session")
    assert first_session_badge["is_unlocked"] is False

    # 2. Create study goal
    goal_res = client.post(
        "/api/v1/goals",
        headers=test_user["headers"],
        json={
            "goal_type": "weekly_time",
            "target_value": 300,
            "period": "weekly",
        },
    )
    assert goal_res.status_code == 201
    goal = goal_res.json()
    assert goal["target_value"] == 300
    assert goal["progress_percentage"] == 0

    # 3. Complete a study session
    tech_res = client.get("/api/v1/techniques", headers=test_user["headers"])
    pomodoro = next(t for t in tech_res.json() if t["slug"] == "pomodoro")

    s_res = client.post(
        "/api/v1/sessions",
        headers=test_user["headers"],
        json={"technique_id": pomodoro["id"], "planned_duration": 1500},
    )
    s_id = s_res.json()["id"]

    client.post(
        f"/api/v1/sessions/{s_id}/complete",
        headers=test_user["headers"],
        json={"concentration_rating": 5},
    )

    # 4. Re-check achievements: 'first-session' badge should now be unlocked!
    ach_res_after = client.get("/api/v1/achievements", headers=test_user["headers"])
    ach_after = ach_res_after.json()
    first_session_badge_after = next(a for a in ach_after if a["slug"] == "first-session")
    assert first_session_badge_after["is_unlocked"] is True
    assert first_session_badge_after["unlocked_at"] is not None


def test_analytics_overview(client, test_user):
    res = client.get("/api/v1/analytics/overview?days=7", headers=test_user["headers"])
    assert res.status_code == 200
    data = res.json()
    assert "daily_focus_trend" in data
    assert "subject_distribution" in data
    assert "technique_usage" in data
    assert "recall_performance" in data
    assert len(data["daily_focus_trend"]) == 7
    assert len(data["consistency_calendar"]) == 30
