from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import caller, signed_in
from app.db.session import get_db
from app.models import User
from app.repositories import Logins
from app.schemas.auth import Account, Credentials
from app.services import Accounts, Rejected, Taken

router = APIRouter()


def plant(response: Response, token: str) -> None:
    response.set_cookie(
        settings.cookie.name,
        token,
        max_age=settings.cookie.max_age,
        httponly=True,
        secure=settings.cookie.secure,
        samesite=settings.cookie.samesite,
        path="/",
    )


@router.post("/auth/signup", response_model=Account, status_code=201)
def signup(
    body: Credentials, request: Request, response: Response, db: Session = Depends(get_db)
) -> User:
    service = Accounts(db)
    try:
        user = service.create(str(body.email), body.secret, body.name)
    except Taken:
        raise HTTPException(status_code=409, detail="that address is taken") from None
    address = request.client.host if request.client else None
    plant(response, service.start(user, address, request.headers.get("user-agent")))
    return user


@router.post("/auth/login", response_model=Account)
def login(
    body: Credentials, request: Request, response: Response, db: Session = Depends(get_db)
) -> User:
    service = Accounts(db)
    try:
        user = service.verify(str(body.email), body.secret)
    except Rejected:
        raise HTTPException(status_code=401, detail="those details do not match") from None
    address = request.client.host if request.client else None
    plant(response, service.start(user, address, request.headers.get("user-agent")))
    return user


@router.post("/auth/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    token = request.cookies.get(settings.cookie.name)
    if token:
        Accounts(db).finish(token)
    response.delete_cookie(settings.cookie.name, path="/")


@router.get("/auth/me", response_model=Account | None)
def me(user: User | None = Depends(caller)) -> User | None:
    return user


@router.get("/auth/sessions")
def sessions(user: User = Depends(signed_in), db: Session = Depends(get_db)) -> list[dict]:
    return [
        {"address": r.address, "agent": r.agent, "created": r.created, "expires": r.expires}
        for r in Logins(db).for_user(user.id)
    ]
