from sqlalchemy import select

from app.models import Login
from app.repositories.base import Repository


class Logins(Repository[Login]):
    model = Login

    def by_token(self, token: str) -> Login | None:
        stmt = select(Login).where(Login.token == token)
        return self.db.execute(stmt).scalar_one_or_none()

    def for_user(self, user_id: int) -> list[Login]:
        stmt = select(Login).where(Login.user_id == user_id)
        return list(self.db.execute(stmt).scalars().all())
