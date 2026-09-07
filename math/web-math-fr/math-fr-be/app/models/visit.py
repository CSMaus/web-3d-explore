from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(primary_key=True)
    address: Mapped[str] = mapped_column(String(45), index=True)
    route: Mapped[str] = mapped_column(String(255))
    agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    consent: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
