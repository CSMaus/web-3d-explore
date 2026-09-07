from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Login(Base):
    __tablename__ = "logins"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user = relationship("User", back_populates="sessions")
