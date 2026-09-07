from fastapi.testclient import TestClient


def test_signup_then_login(client: TestClient, account: dict):
    created = client.post("/api/auth/signup", json=account)
    assert created.status_code in (201, 409)

    wrong = {**account, "secret": "wrong-secret-here"}
    assert client.post("/api/auth/login", json=wrong).status_code == 401

    ok = client.post("/api/auth/login", json=account)
    assert ok.status_code == 200
    assert ok.json()["email"] == account["email"]
    assert client.get("/api/auth/me").json()["email"] == account["email"]

    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").json() is None


def test_signup_rejects_a_short_secret(client: TestClient):
    body = {"email": "short@example.com", "secret": "tiny"}
    assert client.post("/api/auth/signup", json=body).status_code == 422


def test_sessions_need_a_caller(client: TestClient):
    client.post("/api/auth/logout")
    assert client.get("/api/auth/sessions").status_code == 401


def test_sessions_record_the_address(client: TestClient, account: dict):
    client.post("/api/auth/signup", json=account)
    client.post("/api/auth/login", json=account)
    rows = client.get("/api/auth/sessions").json()
    assert rows
    assert rows[0]["address"]
    client.post("/api/auth/logout")
