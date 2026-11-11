def test_register_success(client):
    res = client.post("/api/v1/auth/register", json={
        "name": "Alice Wonderland",
        "email": "alice@example.com",
        "password": "SecretPassword123!",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["name"] == "Alice Wonderland"
    assert data["user"]["preferences"]["daily_goal_minutes"] == 120


def test_register_duplicate_email(client, test_user):
    res = client.post("/api/v1/auth/register", json={
        "name": "Another Jane",
        "email": "jane@example.com",
        "password": "Password123!",
    })
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]


def test_login_success(client, test_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "jane@example.com",
        "password": "Password123!",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "jane@example.com"


def test_login_invalid_password(client, test_user):
    res = client.post("/api/v1/auth/login", json={
        "email": "jane@example.com",
        "password": "WrongPassword!",
    })
    assert res.status_code == 401


def test_get_me_authenticated(client, test_user):
    res = client.get("/api/v1/users/me", headers=test_user["headers"])
    assert res.status_code == 200
    assert res.json()["email"] == "jane@example.com"


def test_get_me_unauthorized(client):
    res = client.get("/api/v1/users/me")
    assert res.status_code == 401
