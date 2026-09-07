from datetime import UTC, datetime, timedelta

from sqlalchemy import delete

from app.core.config import settings
from app.models import Visit
from app.repositories.base import Repository


class Visits(Repository[Visit]):
    model = Visit

    def note(self, address: str, route: str, agent: str | None, consent: str | None) -> None:
        self.db.add(
            Visit(
                address=address[:45],
                route=route[:255],
                agent=(agent or "")[:255] or None,
                consent=(consent or "")[:32] or None,
            )
        )
        self.db.commit()

    def purge(self) -> int:
        edge = datetime.now(UTC) - timedelta(days=settings.privacy.visit_retention_days)
        result = self.db.execute(delete(Visit).where(Visit.created < edge))
        self.db.commit()
        return result.rowcount or 0
