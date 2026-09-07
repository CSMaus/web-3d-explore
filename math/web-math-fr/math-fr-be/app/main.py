from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api
from app.core.config import settings
from app.core.logger import setup
from app.middleware.visits import VisitLog

setup()

app = FastAPI(title=settings.app.title, debug=settings.app.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(VisitLog)

app.include_router(api, prefix=settings.app.api_prefix)
