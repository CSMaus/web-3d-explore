from fastapi import APIRouter

from app.api.v1 import auth, health, presets, topics, ws

v1 = APIRouter()
v1.include_router(health.router, tags=["health"])
v1.include_router(topics.router, tags=["topics"])
v1.include_router(auth.router, tags=["accounts"])
v1.include_router(presets.router, tags=["presets"])
v1.include_router(ws.router, tags=["deep"])
