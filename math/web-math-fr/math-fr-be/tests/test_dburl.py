import os

from app.core.config import settings
from app.db.session import db_url


def test_ordinary_host_and_port(monkeypatch):
    monkeypatch.setenv("DB_PASSWORD", "plain")
    monkeypatch.setattr(settings.db, "host", "10.20.0.3")
    monkeypatch.setattr(settings.db, "port", 5432)
    assert (
        db_url()
        == f"postgresql+psycopg://{settings.db.user}:plain@10.20.0.3:5432/{settings.db.name}"
    )


def test_a_slashed_host_is_a_socket_directory(monkeypatch):
    monkeypatch.setenv("DB_PASSWORD", "plain")
    monkeypatch.setattr(settings.db, "host", "/cloudsql/proj:europe-west1:mathfr")
    url = db_url()
    assert url.startswith(
        f"postgresql+psycopg://{settings.db.user}:plain@/{settings.db.name}?host="
    )
    assert "%2Fcloudsql%2Fproj%3Aeurope-west1%3Amathfr" in url


def test_a_password_with_punctuation_survives(monkeypatch):
    monkeypatch.setenv("DB_PASSWORD", "p@ss/w:rd?")
    monkeypatch.setattr(settings.db, "host", "localhost")
    assert "p%40ss%2Fw%3Ard%3F" in db_url()
    assert os.getenv("DB_PASSWORD") == "p@ss/w:rd?"


def test_an_empty_log_path_leaves_only_the_stream(monkeypatch):
    import logging

    from app.core import logger as mod

    root = logging.getLogger("mathfr")
    kept = root.handlers[:]
    root.handlers = []
    try:
        monkeypatch.setattr(settings.log, "path", "")
        made = mod.setup()
        assert [type(h).__name__ for h in made.handlers] == ["StreamHandler"]
    finally:
        root.handlers = kept
