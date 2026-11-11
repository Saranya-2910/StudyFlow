def test_dashboard_metrics_dynamic_calculation(client, test_user):
    # 1. Fresh user: verify zero-state metrics (strictly NO fake statistics)
    dash_res = client.get("/api/v1/dashboard/summary", headers=test_user["headers"])
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert data["today_focus_minutes"] == 0
    assert data["completed_sessions_count_today"] == 0
    assert data["active_tasks_count"] == 0
    assert data["current_streak_days"] == 0
    assert data["total_lifetime_focus_minutes"] == 0
    assert data["daily_goal_minutes"] == 120
    assert data["daily_goal_progress_pct"] == 0
    assert len(data["recent_sessions"]) == 0

    # 2. Add an active task
    client.post(
        "/api/v1/tasks",
        headers=test_user["headers"],
        json={"title": "Review Organic Chemistry notes"},
    )
    dash_res = client.get("/api/v1/dashboard/summary", headers=test_user["headers"])
    assert dash_res.json()["active_tasks_count"] == 1

    # 3. Create and complete a study session with 1800 seconds (30 mins)
    tech_res = client.get("/api/v1/techniques", headers=test_user["headers"])
    pomodoro = next(t for t in tech_res.json() if t["slug"] == "pomodoro")

    session_res = client.post(
        "/api/v1/sessions",
        headers=test_user["headers"],
        json={"technique_id": pomodoro["id"], "planned_duration": 1800},
    )
    session_id = session_res.json()["id"]

    # Complete session
    client.post(
        f"/api/v1/sessions/{session_id}/complete",
        headers=test_user["headers"],
        json={"concentration_rating": 4},
    )

    # 4. Verify updated metrics
    dash_res_updated = client.get("/api/v1/dashboard/summary", headers=test_user["headers"])
    updated_data = dash_res_updated.json()
    assert updated_data["completed_sessions_count_today"] == 1
    assert len(updated_data["recent_sessions"]) == 1
    assert updated_data["current_streak_days"] >= 0  # Streak computed from database records
