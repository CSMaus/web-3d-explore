import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def origin() -> dict[str, str]:
    return {"origin": "http://localhost:1263"}


@pytest.fixture
def account() -> dict[str, str]:
    return {"email": "one@example.com", "secret": "a-long-enough-secret", "name": "one"}
