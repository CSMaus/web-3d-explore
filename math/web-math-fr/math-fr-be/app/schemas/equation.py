from pydantic import BaseModel


class Block(BaseModel):
    label: str
    tex: str
    note: str


class Dimension(BaseModel):
    label: str
    tex: str
    note: str


class System(BaseModel):
    id: str
    name: str
    summary: str
    blocks: list[Block]
    dimension: Dimension


class Definition(BaseModel):
    id: str
    name: str
    tex: str
    note: str


class Theory(BaseModel):
    systems: list[System]
    definitions: list[Definition]
