from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.db.session import Factory
from app.models import Visit
from app.repositories import Visits


def count() -> int:
    db = Factory()
    try:
        return db.execute(select(func.count()).select_from(Visit)).scalar_one()
    finally:
        db.close()


def test_a_request_is_recorded(client: TestClient):
    before = count()
    client.get("/api/equations")
    assert count() > before


def test_health_is_not_recorded(client: TestClient):
    before = count()
    client.get("/api/health")
    assert count() == before


def test_purge_removes_nothing_fresh():
    db = Factory()
    try:
        assert Visits(db).purge() == 0
    finally:
        db.close()
