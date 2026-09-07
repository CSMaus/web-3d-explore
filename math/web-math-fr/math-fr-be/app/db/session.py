import os
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def db_url() -> str:
    """
    the connection string. a host that starts with a slash is a unix socket
    directory, which is how a managed instance is reached from a serverless
    container without a private network; anything else is host and port.
    """
    password = quote_plus(os.getenv("DB_PASSWORD", ""))
    user = quote_plus(settings.db.user)
    if settings.db.host.startswith("/"):
        socket = quote_plus(settings.db.host)
        return f"postgresql+psycopg://{user}:{password}@/{settings.db.name}?host={socket}"
    return f"postgresql+psycopg://{user}:{password}@{settings.db.host}:{settings.db.port}/{settings.db.name}"


engine = create_engine(
    db_url(),
    pool_pre_ping=True,
    pool_size=settings.db.pool_size,
    pool_recycle=settings.db.pool_recycle,
    future=True,
)
Factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    db: Session = Factory()
    try:
        yield db
    finally:
        db.close()
