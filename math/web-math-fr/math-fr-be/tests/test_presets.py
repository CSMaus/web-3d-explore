from fastapi.testclient import TestClient

SET = {
    "system": "ifs",
    "title": "a fern",
    "params": {"points": 90000},
    "palette": {"id": "leaf"},
}


def test_keep_and_read_without_an_account(client: TestClient):
    client.post("/api/auth/logout")
    made = client.post("/api/presets", json=SET)
    assert made.status_code == 201
    slug = made.json()["slug"]
    assert client.get(f"/api/presets/{slug}").json()["system"] == "ifs"


def test_unknown_system_is_refused(client: TestClient):
    body = {"system": "nope", "params": {}, "palette": {}}
    assert client.post("/api/presets", json=body).status_code == 422


def test_missing_slug_is_refused(client: TestClient):
    assert client.get("/api/presets/missing").status_code == 404


def test_a_private_set_is_hidden(client: TestClient, account: dict):
    client.post("/api/auth/signup", json=account)
    client.post("/api/auth/login", json=account)
    made = client.post("/api/presets", json={**SET, "public": False})
    slug = made.json()["slug"]
    assert client.get(f"/api/presets/{slug}").status_code == 200
    client.post("/api/auth/logout")
    assert client.get(f"/api/presets/{slug}").status_code == 404


def test_listing_needs_an_account(client: TestClient, account: dict):
    client.post("/api/auth/logout")
    assert client.get("/api/presets").status_code == 401
    client.post("/api/auth/login", json=account)
    assert len(client.get("/api/presets").json()) >= 1
    client.post("/api/auth/logout")
