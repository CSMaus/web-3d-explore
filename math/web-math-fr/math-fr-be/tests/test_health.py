from fastapi.testclient import TestClient


def test_health(client: TestClient):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_health_db(client: TestClient):
    assert client.get("/api/health/db").json()["status"] == "ok"
