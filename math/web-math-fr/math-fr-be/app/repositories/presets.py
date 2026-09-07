from sqlalchemy import select

from app.models import Preset
from app.repositories.base import Repository


class Presets(Repository[Preset]):
    model = Preset

    def by_slug(self, slug: str) -> Preset | None:
        stmt = select(Preset).where(Preset.slug == slug)
        return self.db.execute(stmt).scalar_one_or_none()

    def for_user(self, user_id: int) -> list[Preset]:
        stmt = select(Preset).where(Preset.owner_id == user_id).order_by(Preset.created.desc())
        return list(self.db.execute(stmt).scalars().all())
