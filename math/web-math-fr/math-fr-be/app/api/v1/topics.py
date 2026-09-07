from fastapi import APIRouter, HTTPException

from app.content.topics import TOPICS, find
from app.schemas.equation import System, Theory
from app.schemas.topic import Card, Detail

router = APIRouter()


def wanted(slug: str):
    topic = find(slug)
    if topic is None:
        raise HTTPException(status_code=404, detail="unknown topic")
    return topic


@router.get("/topics", response_model=list[Card])
def topics() -> list[dict]:
    return [topic.card() for topic in TOPICS]


@router.get("/topics/{slug}", response_model=Detail)
def one(slug: str) -> dict:
    return wanted(slug).detail()


@router.get("/topics/{slug}/equations", response_model=Theory)
def equations(slug: str) -> dict:
    topic = wanted(slug)
    return {"systems": topic.systems, "definitions": topic.definitions}


@router.get("/topics/{slug}/equations/{system_id}", response_model=System)
def equations_one(slug: str, system_id: str) -> dict:
    for item in wanted(slug).systems:
        if item["id"] == system_id:
            return item
    raise HTTPException(status_code=404, detail="unknown system")
