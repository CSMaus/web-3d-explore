"""
the seven play pages of the opening topic, imaginary numbers from nothing, with
the mathematics each one moves. each note reads on its own: it says what every
letter stands for and reads the formula back with a number.
"""

SYSTEMS = [
    {
        "id": "line",
        "name": "Numbers on a line, and the one question they cannot answer",
        "summary": (
            "Every ordinary number is a point on a line. Adding a number slides the line, "
            "multiplying stretches it, and multiplying by minus one flips it over. The numbers from "
            "minus three to three are tried one by one: none of them, multiplied by itself, gives minus one"
        ),
        "blocks": [
            {
                "label": "Adding slides the line",
                "tex": r"x \mapsto x + a",
                "note": (
                    "Read: each number x is sent to x plus a, where a is the number added. Every point "
                    "moves the same distance in the same direction. With a = 2, the number 1 goes to 3"
                ),
            },
            {
                "label": "Multiplying stretches the line, and a negative number also flips it",
                "tex": r"x \mapsto k\,x, \qquad x \mapsto -x",
                "note": (
                    "Read: each number x is sent to k times x, where k is the multiplier. With k = 2 every "
                    "distance from zero doubles, so 3 goes to 6. With k = minus one every number goes to the "
                    "other side of zero at the same distance, so 3 goes to minus 3: the line is flipped over"
                ),
            },
            {
                "label": "The question",
                "tex": r"x^{2} = -1 \quad \text{has no } x \text{ on the line}",
                "note": (
                    "x squared, written with a small 2, means x times x. The square of any number on the line "
                    "is zero or more: a positive number times a positive number is positive, and a negative "
                    "number times a negative number is positive too. So no x on the line has the square minus "
                    "one. The page tries the numbers from minus three to three and draws their squares, and "
                    "none of them goes below zero"
                ),
            },
        ],
        "dimension": {
            "label": "What is missing",
            "tex": r"\text{a number that, applied twice, flips}",
            "note": (
                "Multiplying by minus one flips the line over. The question asks for a number that gives this "
                "flip when it is used twice as a multiplier: half of a flip. A line has no room for half a flip. "
                "A flat plane has room for it, as a quarter turn"
            ),
        },
    },
    {
        "id": "turn",
        "name": "What 𝑖 is",
        "summary": (
            "Multiplying by minus one turns every arrow from zero half way round. A number that turns an "
            "arrow only a quarter of the way round is written i. Two quarter turns make a half turn, so i "
            "times i is minus one"
        ),
        "blocks": [
            {
                "label": "The definition",
                "tex": r"i \cdot i = -1",
                "note": (
                    "Read: i times i equals minus one. A quarter turn followed by another quarter turn is a half "
                    "turn, and a half turn about zero is what multiplying by minus one does. So the number i, "
                    "which makes a quarter turn, has the square minus one"
                ),
            },
            {
                "label": "Going round",
                "tex": r"1,\ i,\ -1,\ -i,\ 1,\ \ldots",
                "note": (
                    "Start at 1 and multiply by 𝑖 again and again. Each time the arrow turns a quarter turn "
                    "anticlockwise. The results are 1, i, minus 1, minus i, and after four steps 1 again. The "
                    "page draws these arrows"
                ),
            },
            {
                "label": "A second axis",
                "tex": r"a + b\,i",
                "note": (
                    "Every point of the plane is now a number: a is how far across from zero, b is how far up. "
                    "For example, 2 + 3i lies 2 across and 3 up. Such numbers are called complex numbers. The "
                    "ordinary numbers are the ones with b equal to zero"
                ),
            },
        ],
        "dimension": {
            "label": "The name",
            "tex": r"\text{imaginary} = \text{on the second axis}",
            "note": (
                "Numbers on the vertical axis, such as 3i, are called imaginary. The name was given in the "
                "seventeenth century as mockery and kept by habit. Such a number is no less real than a length"
            ),
        },
    },
    {
        "id": "add",
        "name": "Complex numbers: adding",
        "summary": (
            "A complex number is a point of a flat plane: so far across and so far up. Drawn as an arrow "
            "from zero, two such numbers are added by placing a copy of the second arrow at the tip of the "
            "first. The across parts add together, and the up parts add together"
        ),
        "blocks": [
            {
                "label": "Adding",
                "tex": r"(a + b\,i) + (c + d\,i) = (a + c) + (b + d)\,i",
                "note": (
                    "Here a and c are the across parts of the two numbers, and b and d are their up parts. The "
                    "across parts are added, and the up parts are added, each pair on its own. For example, "
                    "(2 + 1i) + (-1 + 2i) = 1 + 3i. The page lays the second arrow out from the tip of the first"
                ),
            },
            {
                "label": "Subtracting",
                "tex": r"z - w = z + (-w)",
                "note": (
                    "z and w are two complex numbers. Taking w away is the same as adding minus w, which is the "
                    "arrow w turned half way round. The page does the same walk with that turned arrow"
                ),
            },
            {
                "label": "The length",
                "tex": r"|a + b\,i| = \sqrt{a^{2} + b^{2}}",
                "note": (
                    "The two upright bars mean the length of the arrow: the distance from zero to the point. "
                    "By Pythagoras' theorem it is the square root of a squared plus b squared. For 3 + 4i the "
                    "length is the square root of 9 + 16, which is 5"
                ),
            },
        ],
        "dimension": {
            "label": "What adding does not do",
            "tex": r"|z + w| \le |z| + |w|",
            "note": (
                "Read: the length of z plus w is at most the length of z plus the length of w. The two lengths "
                "add up exactly only when the arrows point the same way. Adding moves arrows but never turns "
                "them; turning comes from multiplying"
            ),
        },
    },
    {
        "id": "multiply",
        "name": "Complex numbers: multiplying",
        "summary": (
            "Each arrow from zero has a length and an angle. Multiplying two complex numbers multiplies "
            "their lengths and adds their angles. The page turns and stretches one arrow until it becomes "
            "the product"
        ),
        "blocks": [
            {
                "label": "The four terms",
                "tex": r"(a + b\,i)(c + d\,i) = (ac - bd) + (ad + bc)\,i",
                "note": (
                    "Multiplying out the brackets gives four terms: a times c, a times di, bi times c, and bi "
                    "times di. The last one contains 𝑖 times 𝑖, which is minus one, and that is where the minus "
                    "sign in ac minus bd comes from. For example, (2 + 1i)(1 + 1i) = 1 + 3i"
                ),
            },
            {
                "label": "What that is, as a picture",
                "tex": r"|z\,w| = |z|\,|w|, \qquad \angle(z\,w) = \angle z + \angle w",
                "note": (
                    "The bars mean length, and the angle sign means the angle of the arrow, measured "
                    "anticlockwise from the right-hand half of the horizontal axis. The length of the product "
                    "is the two lengths multiplied, and its angle is the two angles added. The page reaches the "
                    "product by turning the first arrow by the angle of the second and stretching it by the "
                    "length of the second"
                ),
            },
            {
                "label": "Multiplying by i",
                "tex": r"|i| = 1, \qquad \angle i = \tfrac{1}{4} \text{ turn}",
                "note": (
                    "The number 𝑖 has length one and points straight up, a quarter turn from the horizontal "
                    "axis. So multiplying by 𝑖 turns an arrow a quarter turn and does not stretch it"
                ),
            },
        ],
        "dimension": {
            "label": "Length and angle describe a number as fully as its two parts do",
            "tex": r"z = r(\cos\theta + i\sin\theta)",
            "note": (
                "Here r is the length of the arrow z and theta is its angle. The cosine and the sine of an angle "
                "are how far across and how far up a point lies on a circle of radius one, turned by that angle. "
                "So the same arrow can be given by its two parts or by its length and angle; the page shows both"
            ),
        },
    },
    {
        "id": "square",
        "name": "Which points stay near zero? The Mandelbrot set",
        "summary": (
            "Start at zero, multiply the number by itself, add a fixed complex number c, and repeat. For "
            "some values of c the results stay close to zero for ever; for others they run off. The values "
            "of c that stay close form a shape called the Mandelbrot set"
        ),
        "blocks": [
            {
                "label": "One squaring",
                "tex": r"|z^{2}| = |z|^{2}, \qquad \angle z^{2} = 2\,\angle z",
                "note": (
                    "Squaring z means multiplying it by itself. Its length is multiplied by itself: an arrow of "
                    "length 1.5 becomes an arrow of length 2.25. Its angle is added to itself: an angle of 30 "
                    "degrees becomes 60 degrees"
                ),
            },
            {
                "label": "Square and add c",
                "tex": r"z_{0} = 0, \qquad z_{n+1} = z_n^{2} + c",
                "note": (
                    "Read: the first point, z with the small 0, is zero; each next point is the previous point "
                    "squared, plus c. The small n counts the steps. With c = -1 the points are 0, -1, 0, -1 and "
                    "so on. The page draws these points as the path from zero"
                ),
            },
            {
                "label": "The Mandelbrot set",
                "tex": r"M = \{\, c : |z_n| \le 2 \text{ for every } n \,\}",
                "note": (
                    "Read: M is the set of all c for which every point of the path stays within distance two of "
                    "zero. With c = -1 the path only visits 0 and -1, so -1 is in the set. With c = 1 the path "
                    "is 0, 1, 2, 5, 26 and runs off, so 1 is not. The page fills in the values of c that stay"
                ),
            },
        ],
        "dimension": {
            "label": "The escape test",
            "tex": r"|z_n| > 2 \implies |z_{n+k}| \to \infty",
            "note": (
                "Read: once a point of the path is more than two from zero, the later points grow without "
                "limit. Past that distance, squaring makes the length grow faster than adding c can pull it "
                "back. This is how the page decides that a path has run off"
            ),
        },
    },
    {
        "id": "round",
        "name": "Euler's formula: a point that goes round a circle",
        "summary": (
            "A point that is always pushed at right angles to the line from zero goes round a circle. "
            "Written with i, this motion is Euler's formula. Its shadows on the two axes are the cosine and "
            "the sine waves, and half a turn lands on minus one"
        ),
        "blocks": [
            {
                "label": "Euler's formula",
                "tex": r"e^{i\theta} = \cos\theta + i\,\sin\theta",
                "note": (
                    "Here e is the number about 2.718 that describes growth, and theta is an angle in radians: "
                    "a full turn is 2 pi, about 6.28. The formula says that e to the power i theta is the point "
                    "on the circle of radius one at the angle theta: cos theta across and sin theta up. The page "
                    "runs theta round and draws the two shadows as waves"
                ),
            },
            {
                "label": "Why it goes round",
                "tex": r"\frac{d}{d\theta} e^{i\theta} = i\,e^{i\theta}",
                "note": (
                    "The left side is the rate at which the point moves as theta grows, called the derivative. "
                    "The right side is the point multiplied by i, that is, turned a quarter turn. So the point "
                    "always moves at right angles to the line from zero, never outward and never inward. That "
                    "is motion round a circle"
                ),
            },
            {
                "label": "The famous case",
                "tex": r"e^{i\pi} + 1 = 0",
                "note": (
                    "At theta = pi, half a turn, the point is minus one, so e to the power i pi, plus one, "
                    "equals zero. The page shows this point when the angle reaches pi"
                ),
            },
        ],
        "dimension": {
            "label": "Where this is used",
            "tex": r"\text{turns, waves, alternating current}",
            "note": (
                "Multiplying by e to the power i theta turns an arrow by the angle theta without stretching it. "
                "Anything that turns or swings back and forth at a steady pace can be written this way: the "
                "shadow of a point going round a circle is a wave"
            ),
        },
    },
    {
        "id": "quaternions",
        "name": "Quaternions: turns in space",
        "summary": (
            "A turn in three-dimensional space can be written with four numbers, called a quaternion: one "
            "for how far to turn and three for the axis. An axis and an angle are chosen, a house turns step "
            "by step, and the four numbers of the turn are shown"
        ),
        "blocks": [
            {
                "label": "Hamilton's rule, 1843",
                "tex": r"i^{2} = j^{2} = k^{2} = ijk = -1, \qquad ij = k,\ ji = -k",
                "note": (
                    "Quaternions have three imaginary units, i, j and k, instead of one. Each of them squares to "
                    "minus one, and so does the product i j k. The second half follows from the first: i times j "
                    "is k, but j times i is minus k. The order of a product matters, which never happens with "
                    "ordinary or complex numbers"
                ),
            },
            {
                "label": "A turn as a quaternion",
                "tex": r"q = \cos\tfrac{\theta}{2} + \sin\tfrac{\theta}{2}\,(u_{x} i + u_{y} j + u_{z} k)",
                "note": (
                    "The turn by the angle theta about an axis u. The axis is given by three numbers, u x, u y "
                    "and u z, its direction across, up and out, with length one. Half the angle goes into the "
                    "formula. That is why a full turn gives the quaternion minus one, and two full turns give one"
                ),
            },
            {
                "label": "Turning a point",
                "tex": r"v' = q\, v\, q^{-1}",
                "note": (
                    "The point v is written as a quaternion with no ordinary part, only the parts along i, j "
                    "and k. It is multiplied by q on the left and by the inverse of q, the quaternion that undoes "
                    "the turn, on the right. This product is called the sandwich, and v prime is the turned point. "
                    "In a flat plane the sandwich becomes a single multiplication, because there the order never "
                    "matters"
                ),
            },
            {
                "label": "Two turns",
                "tex": r"q_{2} q_{1} \neq q_{1} q_{2}",
                "note": (
                    "Turning first by q1 and then by q2 is the product q2 q1, written from right to left. The "
                    "other order is q1 q2, and in general it is a different turn. The page draws both orders at "
                    "once, and the two houses end up facing different ways"
                ),
            },
            {
                "label": "The path between two orientations",
                "tex": r"\mathrm{slerp}(a, b, t) = \frac{\sin((1-t)\Omega)}{\sin\Omega}\, a + \frac{\sin(t\Omega)}{\sin\Omega}\, b",
                "note": (
                    "Slerp, published by Shoemake in 1985, gives the shortest steady turn from the orientation a "
                    "to the orientation b. The fraction t runs from 0 at a to 1 at b, and omega is the angle "
                    "between a and b. It is used by every game engine and by the run on this page"
                ),
            },
        ],
        "dimension": {
            "label": "Only three such systems",
            "tex": r"\mathbb{R},\ \mathbb{C},\ \mathbb{H}",
            "note": (
                "Frobenius proved in 1878 that the real numbers, written R, the complex numbers, written C, and "
                "the quaternions, written H, are the only finite systems built on the real numbers in which "
                "every non-zero number can be divided by. The next step, the octonions with eight parts, works "
                "only by giving up associativity as well: there (a b) c is no longer always equal to a (b c)"
            ),
        },
    },
]

DEFINITIONS = [
    {
        "id": "plane",
        "name": "The complex plane",
        "tex": r"a + b\,i \longleftrightarrow (a, b)",
        "note": (
            "Every complex number a + bi is a point of a flat plane, a across and b up, or an arrow from zero "
            "to that point. The ordinary number line is the horizontal axis"
        ),
    },
    {
        "id": "modulus",
        "name": "Length and angle",
        "tex": r"|z| = \sqrt{a^{2} + b^{2}}, \qquad \angle z = \operatorname{atan2}(b, a)",
        "note": (
            "The length, written between two upright bars, is how far the arrow reaches from zero. The angle, "
            "written with the angle sign, is the direction it points, measured anticlockwise from the "
            "right-hand half of the horizontal axis; atan2 is the standard function that computes it from b "
            "and a. Multiplying works on lengths and angles; adding works on the two parts"
        ),
    },
    {
        "id": "conjugate",
        "name": "The mirror image",
        "tex": r"\bar{z} = a - b\,i, \qquad z\,\bar{z} = |z|^{2}",
        "note": (
            "The bar over z means its mirror image in the horizontal axis: the same across part, and the up "
            "part with its sign changed. This mirror image is called the conjugate. A number times its "
            "conjugate is its length squared, an ordinary number: (3 + 4i)(3 - 4i) = 25"
        ),
    },
]
