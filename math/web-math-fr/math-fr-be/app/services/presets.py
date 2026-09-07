from sqlalchemy.orm import Session

from app.core.security import new_slug
from app.models import Preset, User
from app.repositories import Presets

KNOWN = ("ifs", "lsystem", "lichtenberg", "dla", "julia", "mandelbrot", "mandelbulb")


class Unknown(Exception):
    pass


class Missing(Exception):
    pass


class Sets:
    def __init__(self, db: Session) -> None:
        self.rows = Presets(db)

    def keep(
        self,
        system: str,
        title: str | None,
        params: dict,
        palette: dict,
        public: bool,
        owner: User | None,
    ) -> Preset:
        if system not in KNOWN:
            raise Unknown
        return self.rows.add(
            Preset(
                slug=new_slug(),
                system=system,
                title=title,
                params=params,
                palette=palette,
                public=public,
                owner_id=owner.id if owner else None,
            )
        )

    def one(self, slug: str, viewer: User | None) -> Preset:
        row = self.rows.by_slug(slug)
        if row is None:
            raise Missing
        if not row.public and (viewer is None or row.owner_id != viewer.id):
            raise Missing
        return row

    def mine(self, user: User) -> list[Preset]:
        return self.rows.for_user(user.id)
