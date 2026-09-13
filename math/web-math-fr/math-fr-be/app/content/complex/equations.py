"""
the six play pages of the opening topic, imaginary numbers from nothing, with
the mathematics each one moves. the notes say what the page shows.
"""

SYSTEMS = [
    {
        "id": "line",
        "name": "Numbers on a line, and the one question they cannot answer",
        "summary": (
            "the ordinary numbers as places on a line, adding as sliding and multiplying as "
            "stretching or flipping, and the question no place on the line answers"
        ),
        "blocks": [
            {
                "label": "Adding slides",
                "tex": r"x \mapsto x + a",
                "note": "every number moves the same distance the same way",
            },
            {
                "label": "Multiplying stretches, and by a negative number flips",
                "tex": r"x \mapsto k\,x, \qquad x \mapsto -x",
                "note": "times two doubles every distance from zero; times minus one turns the whole line round through zero",
            },
            {
                "label": "The question",
                "tex": r"x^{2} = -1 \quad \text{has no } x \text{ on the line}",
                "note": "a number times itself is never below zero: the page tries every x and draws the square, and it never dips under the axis",
            },
        ],
        "dimension": {
            "label": "What is missing",
            "tex": r"\text{a number that, applied twice, flips}",
            "note": "flipping is what minus one does. the question asks for half a flip, and the line has no room for it",
        },
    },
    {
        "id": "turn",
        "name": "A quarter turn, called i",
        "summary": (
            "minus one is a half turn about zero; so half of that is a quarter turn, and a number "
            "that turns by a quarter is what i is. done twice it is a half turn, which is minus one"
        ),
        "blocks": [
            {
                "label": "The definition",
                "tex": r"i \cdot i = -1",
                "note": "not a trick and not a mystery: a quarter turn followed by a quarter turn is a half turn, and a half turn is multiplying by minus one",
            },
            {
                "label": "Going round",
                "tex": r"1,\ i,\ -1,\ -i,\ 1,\ \ldots",
                "note": "the page multiplies by i again and again and the arrow turns a quarter each time, back where it started after four",
            },
            {
                "label": "A second axis",
                "tex": r"a + b\,i",
                "note": "a number is now a place in a plane: a along the old line, b along the new one. the old numbers are the ones with b equal to zero",
            },
        ],
        "dimension": {
            "label": "The name",
            "tex": r"\text{imaginary} = \text{on the second axis}",
            "note": "a name from the seventeenth century, given as an insult and kept by habit. nothing on that axis is less real than a length",
        },
    },
    {
        "id": "add",
        "name": "Adding: arrows tip to tail",
        "summary": (
            "each number an arrow from zero; to add two, put the second arrow's tail on the first "
            "one's tip. the parts add separately and never mix"
        ),
        "blocks": [
            {
                "label": "Adding",
                "tex": r"(a + b\,i) + (c + d\,i) = (a + c) + (b + d)\,i",
                "note": "the along part and the up part each add on their own. the page walks the second arrow out from the first's tip",
            },
            {
                "label": "Subtracting",
                "tex": r"z - w = z + (-w)",
                "note": "the same walk with the second arrow turned round",
            },
            {
                "label": "The length",
                "tex": r"|a + b\,i| = \sqrt{a^{2} + b^{2}}",
                "note": "how far the arrow reaches: Pythagoras on its two parts. two arrows' lengths do not add unless they point the same way",
            },
        ],
        "dimension": {
            "label": "What adding does not do",
            "tex": r"|z + w| \le |z| + |w|",
            "note": "adding never turns anything. the turning is all in multiplying, on the next page",
        },
    },
    {
        "id": "multiply",
        "name": "Multiplying: turn and stretch",
        "summary": (
            "to multiply two arrows, add their angles and multiply their lengths. the page turns "
            "and stretches one arrow into the product while the reader watches"
        ),
        "blocks": [
            {
                "label": "The four terms",
                "tex": r"(a + b\,i)(c + d\,i) = (ac - bd) + (ad + bc)\,i",
                "note": "multiply out as with any two brackets; the one term with i times i in it is minus one, which is where the minus in ac minus bd comes from",
            },
            {
                "label": "What that is, as a picture",
                "tex": r"|z\,w| = |z|\,|w|, \qquad \angle(z\,w) = \angle z + \angle w",
                "note": "lengths multiply, angles add. the page shows the product arrow reached by turning the first by the second's angle and stretching by its length",
            },
            {
                "label": "Multiplying by i again",
                "tex": r"|i| = 1, \qquad \angle i = \tfrac{1}{4} \text{ turn}",
                "note": "so times i is a quarter turn with no stretch, which is the last page's definition read from this page's rule",
            },
        ],
        "dimension": {
            "label": "Length and angle name the number as well as the two parts do",
            "tex": r"z = r(\cos\theta + i\sin\theta)",
            "note": "two ways to say where an arrow points; the page shows both for every arrow it draws",
        },
    },
    {
        "id": "square",
        "name": "Squaring, again and again",
        "summary": (
            "squaring doubles the angle and squares the length. do it again and again and a start "
            "inside the unit circle falls to zero, outside it runs away, on it stays. add a constant "
            "each time and the boundary between falling and running is a Julia set"
        ),
        "blocks": [
            {
                "label": "One squaring",
                "tex": r"|z^{2}| = |z|^{2}, \qquad \angle z^{2} = 2\,\angle z",
                "note": "multiplying a number by itself: the angle adds to itself, the length multiplies by itself",
            },
            {
                "label": "Repeated",
                "tex": r"z_{n+1} = z_n^{2}",
                "note": "a length below one, squared again and again, goes to zero; above one, to infinity; exactly one stays. the circle is the boundary",
            },
            {
                "label": "With a shift",
                "tex": r"z_{n+1} = z_n^{2} + c",
                "note": "square, then slide by c, every step. the boundary between staying and leaving is no longer a circle, and the fractals topic draws it",
            },
        ],
        "dimension": {
            "label": "The escape test",
            "tex": r"|z_n| > 2 \implies |z_{n+k}| \to \infty",
            "note": "once the length passes two the square outruns the shift for ever, which is how the page decides that an orbit has left",
        },
    },
    {
        "id": "round",
        "name": "The exponential goes round",
        "summary": (
            "the growth curve from topic 3, given an imaginary rate, does not grow: it goes round "
            "the unit circle at a steady pace, and its two shadows are the cosine and the sine"
        ),
        "blocks": [
            {
                "label": "Euler's formula",
                "tex": r"e^{i\theta} = \cos\theta + i\,\sin\theta",
                "note": "the point on the unit circle at angle theta. the page runs theta round and draws the two shadows as waves beside it",
            },
            {
                "label": "Why it goes round",
                "tex": r"\frac{d}{d\theta} e^{i\theta} = i\,e^{i\theta}",
                "note": "the rate of change is the position turned a quarter: always sideways, never outward, which is what moving on a circle means",
            },
            {
                "label": "The famous case",
                "tex": r"e^{i\pi} + 1 = 0",
                "note": "half a turn lands on minus one. the page stops there and says so",
            },
        ],
        "dimension": {
            "label": "Where this is used next",
            "tex": r"\text{positions in topic 4, oscillations in topic 2}",
            "note": "the sinusoidal position vectors of topic 4 are this formula at many speeds, and the swing of topic 2 is its real shadow",
        },
    },
    {
        "id": "quaternions",
        "name": "Beyond i: turns in space, and where they are used",
        "summary": (
            "Hamilton's numbers with three imaginary units, a unit one being a turn in space; two "
            "turns in a different order land differently, so the numbers do not commute"
        ),
        "blocks": [
            {
                "label": "Hamilton's rule, 1843",
                "tex": r"i^{2} = j^{2} = k^{2} = ijk = -1, \qquad ij = k,\ ji = -k",
                "note": "three imaginary units instead of one. the second line follows from the first and is the whole difference from the plane: the order of a product matters",
            },
            {
                "label": "A turn as a quaternion",
                "tex": r"q = \cos\tfrac{\theta}{2} + \sin\tfrac{\theta}{2}\,(u_{x} i + u_{y} j + u_{z} k)",
                "note": "the turn by theta about the unit axis u. half the angle goes in, which is why a full turn is minus one and two full turns are one",
            },
            {
                "label": "Turning a point",
                "tex": r"v' = q\, v\, q^{-1}",
                "note": "the point as a quaternion with no real part, sandwiched. in the plane the sandwich collapses to one multiplication, because there the order never mattered",
            },
            {
                "label": "Two turns",
                "tex": r"q_{2} q_{1} \neq q_{1} q_{2}",
                "note": "first q1 then q2 is the product q2 q1. the page draws both orders at once, and the two houses end facing different ways",
            },
            {
                "label": "The path between two orientations",
                "tex": r"\mathrm{slerp}(a, b, t) = \frac{\sin((1-t)\Omega)}{\sin\Omega}\, a + \frac{\sin(t\Omega)}{\sin\Omega}\, b",
                "note": "Shoemake, 1985: the shortest smooth turn from a to b, used by every game engine and by the run on this page",
            },
        ],
        "dimension": {
            "label": "Only three such systems",
            "tex": r"\mathbb{R},\ \mathbb{C},\ \mathbb{H}",
            "note": "Frobenius, 1878: the reals, the complex numbers and the quaternions are the only finite systems over the reals in which every non-zero number divides. the octonions follow by losing associativity too",
        },
    },
]

DEFINITIONS = [
    {
        "id": "plane",
        "name": "The complex plane",
        "tex": r"a + b\,i \longleftrightarrow (a, b)",
        "note": "every number is a place, or an arrow from zero to that place. the old number line is the horizontal axis",
    },
    {
        "id": "modulus",
        "name": "Length and angle",
        "tex": r"|z| = \sqrt{a^{2} + b^{2}}, \qquad \angle z = \operatorname{atan2}(b, a)",
        "note": "how far the arrow reaches and which way it points. multiplying works on these two; adding works on the parts",
    },
    {
        "id": "conjugate",
        "name": "The mirror image",
        "tex": r"\bar{z} = a - b\,i, \qquad z\,\bar{z} = |z|^{2}",
        "note": "the same arrow reflected in the horizontal axis; a number times its mirror image is a plain length squared",
    },
]
