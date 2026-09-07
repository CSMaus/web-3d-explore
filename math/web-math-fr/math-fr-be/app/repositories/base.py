from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import Base


class Repository[Row: Base]:
    model: type[Row]

    def __init__(self, db: Session) -> None:
        self.db = db

    def add(self, row: Row) -> Row:
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def drop(self, row: Row) -> None:
        self.db.delete(row)
        self.db.commit()

    def by_id(self, key: int) -> Row | None:
        return self.db.get(self.model, key)

    def all(self) -> list[Row]:
        return list(self.db.execute(select(self.model)).scalars().all())
