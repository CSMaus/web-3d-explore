from fastapi import APIRouter

from app.api.v1.router import v1

api = APIRouter()
api.include_router(v1)
