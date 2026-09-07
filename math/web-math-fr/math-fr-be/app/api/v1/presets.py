from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import caller, signed_in
from app.db.session import get_db
from app.models import Preset, User
from app.schemas.preset import PresetIn, PresetOut
from app.services import Missing, Sets, Unknown

router = APIRouter()


@router.post("/presets", response_model=PresetOut, status_code=201)
def keep(
    body: PresetIn, user: User | None = Depends(caller), db: Session = Depends(get_db)
) -> Preset:
    try:
        return Sets(db).keep(body.system, body.title, body.params, body.palette, body.public, user)
    except Unknown:
        raise HTTPException(status_code=422, detail="unknown system") from None


@router.get("/presets", response_model=list[PresetOut])
def mine(user: User = Depends(signed_in), db: Session = Depends(get_db)) -> list[Preset]:
    return Sets(db).mine(user)


@router.get("/presets/{slug}", response_model=PresetOut)
def one(slug: str, user: User | None = Depends(caller), db: Session = Depends(get_db)) -> Preset:
    try:
        return Sets(db).one(slug, user)
    except Missing:
        raise HTTPException(status_code=404, detail="no such parameter set") from None
