def test_recommendation_engine(client, test_user):
    # 1. Fresh user gets initial Pomodoro recommendation
    rec_res = client.get("/api/v1/analytics/recommendations", headers=test_user["headers"])
    assert rec_res.status_code == 200
    recs = rec_res.json()
    assert len(recs) >= 1
    assert any("pomodoro" in r["technique_slug"] for r in recs)

    # 2. Add an urgent task -> engine recommends Eat the Frog
    client.post(
        "/api/v1/tasks",
        headers=test_user["headers"],
        json={"title": "Submit Final Thesis Draft", "priority": "urgent"},
    )
    rec_res2 = client.get("/api/v1/analytics/recommendations", headers=test_user["headers"])
    assert rec_res2.status_code == 200
    recs2 = rec_res2.json()
    assert any(r["technique_slug"] == "eat-the-frog" for r in recs2)


def test_export_study_history_csv(client, test_user):
    res = client.get("/api/v1/analytics/export", headers=test_user["headers"])
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    content = res.text
    assert "Session ID,Technique,Subject,Task" in content
