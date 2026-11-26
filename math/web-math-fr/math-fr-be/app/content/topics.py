"""
the registry of what the site covers. one entry a topic, in reading order.

a topic is one subject and one page. its parts are the beats of its series, its
systems are the things a reader can move on its play pages, and its definitions
are the shared machinery its equations page opens with. a topic that has not
been built yet carries no parts and no systems, and says so, so that the site
can show what is coming without pretending it is there.
"""

from dataclasses import dataclass, field

from app.content import chaos, complex, fractals, networks, primes, probability, series, tokens

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
    # an aside sits beside the reading order rather than in it
    aside: bool = False

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
            "aside": self.aside,
        }

    def detail(self) -> dict:
        return {**self.card(), "part_list": self.parts}


TOPICS: tuple[Topic, ...] = (
    Topic(
        slug="complex",
        number=0,
        title="Imaginary numbers",
        summary=(
            "Which number, multiplied by itself, gives -1? No number on the ordinary number line does. "
            "This topic is the place to start, and it needs nothing beyond school arithmetic. It adds a"
            " new number, called i, with i × i = -1, and shows that multiplying by i turns a point a "
            "quarter of a full turn around zero. A number made of an ordinary part and a part counted "
            "in i is called a complex number. The pages add such numbers as arrows placed end to end "
            "and multiply them by turning and stretching. Then a number is squared and a fixed number c"
            " is added, again and again, to see which starting points stay near zero. Together those "
            "points draw a shape called the Mandelbrot set. The last page shows how the number e, about"
            " 2.718, raised to a power that contains i, moves round a circle instead of growing."
        ),
        state=WRITING,
        parts=complex.PARTS,
        systems=complex.SYSTEMS,
        definitions=complex.DEFINITIONS,
    ),
    Topic(
        slug="fractals",
        number=1,
        title="Fractals",
        summary=(
            "Some shapes stay equally rough however closely they are looked at. Such shapes are called "
            "fractals. A line has dimension 1 and a filled square has dimension 2, but a fractal can "
            "have a dimension that is not a whole number. This topic measures that dimension instead of"
            " only admiring the shapes. It also shows the few simple rules that draw every shape in its"
            " video series."
        ),
        state=READY,
        parts=fractals.PARTS,
        systems=fractals.SYSTEMS,
        definitions=fractals.DEFINITIONS,
    ),
    Topic(
        slug="chaos",
        number=2,
        title="Differential equations, attractors and chaos",
        summary=(
            "Many things that change over time follow a rule that links how fast a quantity changes to "
            "its present value. Such a rule is called a differential equation, and its answer is not a "
            "single number but a whole curve over time. Some of these equations are solved by a "
            "formula. When no formula exists, the computer builds the curve in many small steps. Over "
            "time, a system often settles onto a fixed shape, called an attractor. Some systems follow "
            "an exact rule and still cannot be predicted far ahead: this is called chaos. The topic "
            "shows how chaos appears as one setting is turned up, through a cycle that doubles its "
            "length again and again. It ends with an experiment from 1992 that used this chain of ideas"
            " to steady the irregular beating of heart tissue with small, well-timed pulses."
        ),
        state=WRITING,
        parts=chaos.PARTS,
        systems=chaos.SYSTEMS,
        definitions=chaos.DEFINITIONS,
    ),
    Topic(
        slug="networks",
        number=3,
        title="Calculus into a first neural network",
        summary=(
            "How a program learns from examples. The topic starts from the perceptron, one of the first"
            " machines that learned: it multiplies each input by a weight, adds the results and answers"
            " yes or no. That unit became the neuron of today's neural networks. A network of many such"
            " units is written out as a set of equations. The topic shows each method that trains it, "
            "that is, adjusts its weights until its answers match the examples. It ends on the two "
            "ideas all of this is built from: the derivative, which measures how fast a quantity "
            "changes, and the integral, which adds up a quantity that keeps changing."
        ),
        state=WRITING,
        parts=networks.PARTS,
        systems=networks.SYSTEMS,
        definitions=networks.DEFINITIONS,
    ),
    Topic(
        slug="tokens",
        number=4,
        title="Tokens, embeddings and generation",
        summary=(
            "How a language model cuts text into pieces called tokens, turns them into "
            "numbers, lets each word take in the words before it, and writes text one piece "
            "at a time"
        ),
        state=WRITING,
        parts=tokens.PARTS,
        systems=tokens.SYSTEMS,
        definitions=tokens.DEFINITIONS,
    ),
    Topic(
        slug="series",
        number=5,
        title="Series: functions built from simple pieces",
        summary=(
            "A series is a sum of many simple pieces that together rebuild a complicated curve. The "
            "topic shows how a calculator finds sin(x), the sine of an angle, with only additions and "
            "multiplications. It shows why such a sum can stop matching the curve beyond a certain "
            "point, even when the curve is smooth. And it shows how any wave, any drawn outline and any"
            " photograph is rebuilt from turning circles and simple waves."
        ),
        state=WRITING,
        parts=series.PARTS,
        systems=series.SYSTEMS,
        definitions=series.DEFINITIONS,
    ),
    Topic(
        slug="primes",
        number=6,
        title="The gaps between prime numbers",
        summary=(
            "A prime number divides only by 1 and by itself: 2, 3, 5, 7, 11 and so on. The gaps between"
            " neighbouring primes look irregular. This short aside draws each gap against the next one,"
            " the way chaotic systems are often drawn, and puts beside it a sequence that does follow a"
            " rule. Chaos means an exact rule whose results cannot be predicted far ahead, and the "
            "comparison shows what chaos is not."
        ),
        state=WRITING,
        parts=primes.PARTS,
        systems=primes.SYSTEMS,
        definitions=primes.DEFINITIONS,
        aside=True,
    ),
    Topic(
        slug="probability",
        number=7,
        title="Probability: counting chance",
        summary=(
            "Probability is a number from 0 to 1 that says how often something happens when it is tried"
            " many times. The topic computes it in everyday cases. With two dice, why a total of 7 "
            "comes up six times as often as a total of 2. What a positive medical test is really worth."
            " Where a game of chance leaves a player after a thousand rounds. How often a whole minute "
            "passes with no event, when events come at random, and how long a wait lasts. And how often"
            " a gambler reaches a target before losing all the money."
        ),
        state=WRITING,
        parts=probability.PARTS,
        systems=probability.SYSTEMS,
        definitions=probability.DEFINITIONS,
    ),
)

BY_SLUG: dict[str, Topic] = {topic.slug: topic for topic in TOPICS}


def find(slug: str) -> Topic | None:
    return BY_SLUG.get(slug)
