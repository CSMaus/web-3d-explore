from sqlalchemy import select

from app.models import User
from app.repositories.base import Repository


class Users(Repository[User]):
    model = User

    def by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.execute(stmt).scalar_one_or_none()
