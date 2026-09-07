from datetime import UTC, datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import check_secret, hash_secret, new_token
from app.models import Login, User
from app.repositories import Logins, Users


class Taken(Exception):
    pass


class Rejected(Exception):
    pass


class Accounts:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = Users(db)
        self.logins = Logins(db)

    def create(self, email: str, secret: str, name: str | None) -> User:
        user = User(email=email, secret=hash_secret(secret), name=name)
        try:
            return self.users.add(user)
        except IntegrityError:
            self.db.rollback()
            raise Taken from None

    def verify(self, email: str, secret: str) -> User:
        user = self.users.by_email(email)
        if user is None or not user.active or not check_secret(user.secret, secret):
            raise Rejected
        return user

    def start(self, user: User, address: str | None, agent: str | None) -> str:
        token = new_token()
        self.logins.add(
            Login(
                user_id=user.id,
                token=token,
                address=address,
                agent=(agent or "")[:255] or None,
                expires=datetime.now(UTC) + timedelta(seconds=settings.cookie.max_age),
            )
        )
        return token

    def finish(self, token: str) -> None:
        row = self.logins.by_token(token)
        if row is not None:
            self.logins.drop(row)

    def holder(self, token: str) -> User | None:
        row = self.logins.by_token(token)
        if row is None or row.expires < datetime.now(UTC):
            return None
        return row.user
