def test_subject_crud_and_isolation(client, test_user, other_user):
    # User A creates a subject
    res = client.post(
        "/api/v1/subjects",
        headers=test_user["headers"],
        json={"name": "Mathematics", "description": "Calculus and Linear Algebra", "colour": "#4f46e5"},
    )
    assert res.status_code == 201
    subj_a = res.json()
    assert subj_a["name"] == "Mathematics"

    # User A lists subjects -> sees Mathematics
    res = client.get("/api/v1/subjects", headers=test_user["headers"])
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["id"] == subj_a["id"]

    # User B lists subjects -> empty (strict isolation!)
    res = client.get("/api/v1/subjects", headers=other_user["headers"])
    assert res.status_code == 200
    assert len(res.json()) == 0

    # User B attempts to access User A's subject directly -> 404
    res = client.get(f"/api/v1/subjects/{subj_a['id']}", headers=other_user["headers"])
    assert res.status_code == 404

    # User A creates duplicate subject name -> 400
    res = client.post(
        "/api/v1/subjects",
        headers=test_user["headers"],
        json={"name": "Mathematics"},
    )
    assert res.status_code == 400


def test_task_lifecycle_and_enrichment(client, test_user):
    # Create Subject
    subj_res = client.post(
        "/api/v1/subjects",
        headers=test_user["headers"],
        json={"name": "Physics", "colour": "#0ea5e9"},
    )
    subj_id = subj_res.json()["id"]

    # Create Topic
    topic_res = client.post(
        f"/api/v1/subjects/{subj_id}/topics",
        headers=test_user["headers"],
        json={"title": "Thermodynamics", "difficulty": "hard"},
    )
    assert topic_res.status_code == 201
    topic_id = topic_res.json()["id"]

    # Create Task
    task_res = client.post(
        "/api/v1/tasks",
        headers=test_user["headers"],
        json={
            "title": "Solve Carnot cycle problems",
            "subject_id": subj_id,
            "topic_id": topic_id,
            "priority": "high",
            "estimated_duration": 45,
        },
    )
    assert task_res.status_code == 201
    task = task_res.json()
    assert task["title"] == "Solve Carnot cycle problems"
    assert task["subject_name"] == "Physics"
    assert task["topic_title"] == "Thermodynamics"
    assert task["status"] == "pending"

    # Update Task to completed
    patch_res = client.patch(
        f"/api/v1/tasks/{task['id']}",
        headers=test_user["headers"],
        json={"status": "completed"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "completed"
    assert patch_res.json()["completed_at"] is not None
