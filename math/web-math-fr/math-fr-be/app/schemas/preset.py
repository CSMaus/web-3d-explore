from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PresetIn(BaseModel):
    system: str = Field(min_length=1, max_length=32)
    title: str | None = Field(default=None, max_length=120)
    params: dict = Field(default_factory=dict)
    palette: dict = Field(default_factory=dict)
    public: bool = True


class PresetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    system: str
    title: str | None
    params: dict
    palette: dict
    public: bool
    created: datetime
