"""
the registry of what the site covers. one entry a topic, in reading order.

a topic is one subject and one page. its parts are the beats of its series, its
systems are the things a reader can move on its play pages, and its definitions
are the shared machinery its equations page opens with. a topic that has not
been built yet carries no parts and no systems, and says so, so that the site
can show what is coming without pretending it is there.
"""

from dataclasses import dataclass, field

from app.content import fractals

READY = "ready"
WRITING = "writing"
PLANNED = "planned"


@dataclass(frozen=True)
class Topic:
    slug: str
    number: int
    title: str
    summary: str
    state: str
    parts: list[dict] = field(default_factory=list)
    systems: list[dict] = field(default_factory=list)
    definitions: list[dict] = field(default_factory=list)

    @property
    def beats(self) -> int:
        return sum(len(part["beats"]) for part in self.parts)

    @property
    def seconds(self) -> float:
        return sum(beat["seconds"] for part in self.parts for beat in part["beats"])

    def card(self) -> dict:
        return {
            "slug": self.slug,
            "number": self.number,
            "title": self.title,
            "summary": self.summary,
            "state": self.state,
            "parts": len(self.parts),
            "beats": self.beats,
            "seconds": self.seconds,
            "systems": len(self.systems),
        }

    def detail(self) -> dict:
        return {**self.card(), "part_list": self.parts}


TOPICS: tuple[Topic, ...] = (
    Topic(
        slug="fractals",
        number=1,
        title="fractals",
        summary=(
            "roughness that does not smooth out when you look closer, measured rather than "
            "admired: a dimension that is not a whole number, and the handful of rules that "
            "produce every shape in the series"
        ),
        state=READY,
        parts=fractals.PARTS,
        systems=fractals.SYSTEMS,
        definitions=fractals.DEFINITIONS,
    ),
    Topic(
        slug="chaos",
        number=2,
        title="differential equations, attractors and chaos",
        summary=(
            "an equation whose unknown is a function, solved in closed form until that runs "
            "out and numerically after it, the attractor a system settles onto, deterministic "
            "chaos, the route in through period doubling, and the one experiment where the "
            "whole chain was used to do something"
        ),
        state=PLANNED,
    ),
    Topic(
        slug="networks",
        number=3,
        title="calculus into a first neural network",
        summary=(
            "the perceptron, the neuron it became, a network written out as a system of "
            "equations, and every method that trains one, ending on the derivative and the "
            "integral as the two objects all of it was built from"
        ),
        state=PLANNED,
    ),
    Topic(
        slug="tokens",
        number=4,
        title="tokens, embeddings and generation",
        summary=(
            "a string of text turned into numbers, what those numbers come to mean, how "
            "earlier text shapes later text, and how one token at a time becomes a paragraph"
        ),
        state=PLANNED,
    ),
)

BY_SLUG: dict[str, Topic] = {topic.slug: topic for topic in TOPICS}


def find(slug: str) -> Topic | None:
    return BY_SLUG.get(slug)
