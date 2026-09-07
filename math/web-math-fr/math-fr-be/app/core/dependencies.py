from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import User
from app.services import Accounts


def caller(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = request.cookies.get(settings.cookie.name)
    if not token:
        return None
    return Accounts(db).holder(token)


def signed_in(user: User | None = Depends(caller)) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="not signed in")
    return user
