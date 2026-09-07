from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.config import settings
from app.core.visits import worth_logging
from app.db.session import Factory
from app.repositories import Visits


class VisitLog(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        path = request.url.path
        if not worth_logging(path) or not request.client:
            return response
        db = Factory()
        try:
            Visits(db).note(
                request.client.host,
                path,
                request.headers.get("user-agent"),
                request.cookies.get(f"{settings.cookie.name}{settings.privacy.consent_suffix}"),
            )
        except Exception:
            db.rollback()
        finally:
            db.close()
        return response
