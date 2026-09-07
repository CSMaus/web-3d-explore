from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "env": settings.app.env}


@router.get("/health/db")
def health_db() -> dict:
    try:
        with engine.connect() as conn:
            conn.execute(text("select 1"))
    except Exception as exc:
        return {"status": "down", "reason": type(exc).__name__}
    return {"status": "ok"}
