from pydantic import BaseModel


class Beat(BaseModel):
    slug: str
    seconds: float
    video: str
    shows: str
    why: str
    say: str


class Part(BaseModel):
    number: int
    title: str
    # one clip per part. the beats below are the plan the clip was cut from
    video: str = ""
    # a short stand-in for the voice-over, for a reader who cannot hear it
    caption: str = ""
    beats: list[Beat]


class Card(BaseModel):
    """what a topic looks like in the index, without its content."""

    slug: str
    number: int
    title: str
    summary: str
    state: str
    parts: int
    beats: int
    seconds: float
    systems: int
    aside: bool = False


class Detail(Card):
    part_list: list[Part]
