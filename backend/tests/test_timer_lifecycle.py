def test_session_timer_lifecycle(client, test_user):
    # Fetch techniques to get Pomodoro id
    tech_res = client.get("/api/v1/techniques", headers=test_user["headers"])
    assert tech_res.status_code == 200
    techniques = tech_res.json()
    assert len(techniques) >= 10
    pomodoro = next(t for t in techniques if t["slug"] == "pomodoro")

    # 1. Start study session
    start_res = client.post(
        "/api/v1/sessions",
        headers=test_user["headers"],
        json={
            "technique_id": pomodoro["id"],
            "planned_duration": 1500,  # 25 min in seconds
            "notes": "Starting deep focus block",
        },
    )
    assert start_res.status_code == 201
    session = start_res.json()
    assert session["status"] == "running"
    assert session["technique_slug"] == "pomodoro"
    session_id = session["id"]

    # 2. Check active session endpoint
    active_res = client.get("/api/v1/sessions/active", headers=test_user["headers"])
    assert active_res.status_code == 200
    assert active_res.json()["id"] == session_id

    # 3. Pause session
    pause_res = client.post(f"/api/v1/sessions/{session_id}/pause", headers=test_user["headers"])
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "paused"
    assert pause_res.json()["paused_at"] is not None

    # Invalid transition: cannot pause an already paused session
    invalid_pause = client.post(f"/api/v1/sessions/{session_id}/pause", headers=test_user["headers"])
    assert invalid_pause.status_code == 400

    # 4. Resume session
    resume_res = client.post(f"/api/v1/sessions/{session_id}/resume", headers=test_user["headers"])
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "running"
    assert resume_res.json()["paused_at"] is None

    # 5. Complete session with concentration rating
    complete_res = client.post(
        f"/api/v1/sessions/{session_id}/complete",
        headers=test_user["headers"],
        json={"concentration_rating": 5, "notes": "Great session, fully understood topic"},
    )
    assert complete_res.status_code == 200
    completed = complete_res.json()
    assert completed["status"] == "completed"
    assert completed["concentration_rating"] == 5
    assert completed["ended_at"] is not None

    # Active session is now None
    active_res = client.get("/api/v1/sessions/active", headers=test_user["headers"])
    assert active_res.status_code == 200
    assert active_res.json() is None
