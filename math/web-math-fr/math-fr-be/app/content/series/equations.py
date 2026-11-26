"""
topic 5: series. a function rebuilt from simple pieces: powers (Taylor), and sines and
circles (Fourier). five pages, each with the equations it computes.
"""

SYSTEMS = [
    {
        "id": "taylor",
        "name": "Taylor series: a curve from powers of x",
        "summary": (
            "How a calculator finds sin(0.5) with nothing but adding and multiplying: a sum of "
            "powers of x that copies the curve at one point, built one term at a time"
        ),
        "blocks": [
            {
                "label": "The Taylor series about a centre a",
                "tex": r"f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}\,(x-a)^n",
                "note": (
                    "f is the function, a is the centre and n counts the terms from 0. The sign "
                    "Σ means: add up the terms for n = 0, 1, 2 and so on. f^(n)(a) is the n-th "
                    "derivative of f at a. The derivative measures how fast a function changes: "
                    "for n = 1 it is the slope, for n = 2 the bend. n! is the factorial, "
                    "1 × 2 × ... × n. Each new term makes the sum agree with the function in one "
                    "more derivative at a. The page adds the terms one at a time and draws each sum"
                ),
            },
            {
                "label": "The series of sin x about 0",
                "tex": r"\sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \frac{x^7}{7!} + \cdots",
                "note": (
                    "Only odd powers of x appear, with signs that alternate. At x = 0.5 the "
                    "first three terms give 0.4794271. The true value of sin(0.5) is 0.4794255"
                ),
            },
            {
                "label": "A bound on the error",
                "tex": r"|R_n(x)| \le \frac{M\,|x-a|^{n+1}}{(n+1)!}",
                "note": (
                    "R_n(x) is the error left after the term with the power n. M is the largest "
                    "size that the next derivative takes between a and x. The factorial at the "
                    "bottom grows faster than the power at the top, so for sin x and e^x the "
                    "error goes to zero at every x"
                ),
            },
        ],
        "dimension": {
            "label": "Why it works far from the centre",
            "tex": r"\frac{x^{n}}{n!} \to 0 \text{ for every } x",
            "note": (
                "A power of x divided by a factorial gets closer and closer to 0 as n grows, "
                "whatever x is. The power grows, but the factorial grows faster. In the series "
                "of ln(1 + x) the term with the power n is divided only by n, not by n!. So "
                "that series stops working at the distance 1 + a from the centre"
            ),
        },
    },
    {
        "id": "radius",
        "name": "Where a series stops working",
        "summary": (
            "The curve 1/(1 + x^2) is smooth everywhere, yet its series about 0 fails for x "
            "beyond 1 or below -1. The cause is two points that lie outside the ordinary number line"
        ),
        "blocks": [
            {
                "label": "The series about 0",
                "tex": r"\frac{1}{1+x^2} = 1 - x^2 + x^4 - x^6 + \cdots \quad (|x| < 1)",
                "note": (
                    "Each term is the one before times -x^2. The sum works when |x| < 1, that is, "
                    "for x between -1 and 1. At x = 1 and x = -1 the terms stop shrinking, and "
                    "beyond them the terms grow"
                ),
            },
            {
                "label": "The radius of convergence",
                "tex": r"R = \text{distance from } a \text{ to } i = \sqrt{1 + a^2}",
                "note": (
                    "R is how far from the centre a the series works. i is the complex number "
                    "whose square is -1. Complex numbers are drawn as points of a plane, with the "
                    "ordinary number line across it. The function is not defined at i and -i. A "
                    "series about a works inside the largest circle around a that avoids these "
                    "two points, and the radius of that circle is sqrt(1 + a^2)"
                ),
            },
        ],
        "dimension": {
            "label": "What the ordinary number line cannot show",
            "tex": r"1 + z^2 = 0 \iff z = \pm i",
            "note": (
                "1 + z^2 is zero exactly when z is i or -i. Nothing on the ordinary number line "
                "marks x = 1 or x = -1. The limit of the series is set by i and -i, two points "
                "that lie off the line"
            ),
        },
    },
    {
        "id": "fourier",
        "name": "Fourier series: a wave from turning circles",
        "summary": (
            "A square wave, a sawtooth and a triangle wave built from sine waves. Each sine wave "
            "comes from a turning circle, and circles placed on circles draw the whole wave"
        ),
        "blocks": [
            {
                "label": "The square wave as a sum of sine waves",
                "tex": r"\operatorname{sq}(x) = \frac{4}{\pi}\left(\sin x + \frac{\sin 3x}{3} + \frac{\sin 5x}{5} + \cdots\right)",
                "note": (
                    "sq(x) is the square wave: 1 for x between 0 and pi, -1 for x between -pi and "
                    "0, and the same again on every further turn. Only the odd speeds 1, 3, 5 and "
                    "so on appear, and the sine wave of speed k is 1/k as tall as the first"
                ),
            },
            {
                "label": "The size of one circle",
                "tex": r"b_n = \frac{1}{\pi}\int_{-\pi}^{\pi} f(x)\,\sin(nx)\,dx",
                "note": (
                    "b_n says how much of the sine wave of speed n the wave f holds. The wave is "
                    "multiplied by that sine wave and the result is added up over one turn, which "
                    "is what the sign ∫ means. Two different sine waves give zero this way, so "
                    "each b_n can be found on its own"
                ),
            },
            {
                "label": "The overshoot at a jump",
                "tex": r"\max S_N \to \frac{2}{\pi}\operatorname{Si}(\pi) \approx 1.179",
                "note": (
                    "S_N is the sum of the first N terms. Next to a jump the sum rises above the "
                    "wave by about 9 per cent of the jump, however many terms are added. The spike "
                    "gets narrower but not lower. This is called the Gibbs phenomenon. Si is the "
                    "sine integral, a standard function"
                ),
            },
        ],
        "dimension": {
            "label": "A sine wave as a turning circle",
            "tex": r"\sin(nx) = \operatorname{Im}\, e^{inx}",
            "note": (
                "e^(inx) is a point on a circle of radius 1. It goes n times around the circle "
                "while x makes one turn. Im takes its height. So each term is the height of a "
                "point on a turning circle, and adding terms puts circles on circles"
            ),
        },
    },
    {
        "id": "draw",
        "name": "Any outline drawn by turning circles",
        "summary": (
            "The outline of a letter or of an uploaded picture, redrawn by a chain of turning "
            "circles, from one circle up to two hundred"
        ),
        "blocks": [
            {
                "label": "The outline as numbers",
                "tex": r"z_k = x_k + i\,y_k, \quad k = 0, \dots, N-1",
                "note": (
                    "Each point of the outline, x_k across and y_k up, is written as one complex "
                    "number z_k, where i is the number whose square is -1. The page walks once "
                    "around the longest outline in the picture and takes N evenly spaced points on it"
                ),
            },
            {
                "label": "The circles",
                "tex": r"c_n = \frac{1}{N}\sum_{k=0}^{N-1} z_k\, e^{-2\pi i n k / N}",
                "note": (
                    "c_n gives the circle of speed n. That circle turns n times while the outline "
                    "is walked once, the other way round when n is negative. Its radius is |c_n|, "
                    "the size of c_n, and its starting angle is the angle of c_n"
                ),
            },
            {
                "label": "The drawing",
                "tex": r"z(t) = \sum_{n} c_n\, e^{2\pi i n t}",
                "note": (
                    "z(t) is the drawing point at the time t, which runs from 0 to 1 for one walk "
                    "around the outline. Each circle sits on the edge of the one before, largest "
                    "first. With all N circles the point passes through every point of the outline"
                ),
            },
        ],
        "dimension": {
            "label": "How many circles a shape needs",
            "tex": r"\text{error} = \sum_{\text{dropped } n} |c_n|^2",
            "note": (
                "The error of the drawing, measured as the average squared distance from the "
                "outline, equals the sum of the squared radii of the circles left out. This is "
                "Parseval's theorem. Smooth outlines need few circles, corners need many"
            ),
        },
    },
    {
        "id": "frequencies",
        "name": "A photograph kept with only its strongest waves",
        "summary": (
            "A photograph cut into blocks of 8 by 8 pixels, each block written as a sum of 64 "
            "waves and rebuilt from only the strongest of them: the main idea of JPEG"
        ),
        "blocks": [
            {
                "label": "A block as waves",
                "tex": r"F(u,v) = \frac{c_u c_v}{4}\sum_{x=0}^{7}\sum_{y=0}^{7} f(x,y)\cos\frac{(2x+1)u\pi}{16}\cos\frac{(2y+1)v\pi}{16}",
                "note": (
                    "f(x, y) is the grey level of the pixel in column x and row y of the block, "
                    "both counted from 0 to 7. F(u, v) is the strength of the wave that changes u "
                    "times as fast across the block and v times as fast down it. This is called "
                    "the cosine transform, with c_0 = 1/sqrt(2) and c_u = 1 otherwise. 64 pixels "
                    "give 64 strengths, and nothing is lost"
                ),
            },
            {
                "label": "Keeping the strongest waves",
                "tex": r"\hat F(u,v) = \begin{cases} F(u,v) & \text{among the } k \text{ largest} \\ 0 & \text{otherwise} \end{cases}",
                "note": (
                    "Each block keeps its k largest strengths, by size, and sets the rest to zero. "
                    "The block is then rebuilt by running the transform backwards"
                ),
            },
        ],
        "dimension": {
            "label": "Why a photograph survives",
            "tex": r"\sum_{x,y} f^2 = \sum_{u,v} F^2",
            "note": (
                "The sum of the squared grey levels equals the sum of the squared strengths, so "
                "the transform keeps the total energy. In a photograph most of the energy sits in "
                "a few slow waves, so dropping the weak ones costs little. JPEG also rounds the "
                "kept strengths, which this page leaves out"
            ),
        },
    },
]

DEFINITIONS = [
    {
        "id": "series",
        "name": "A series",
        "tex": r"\sum_{n=0}^{\infty} a_n = \lim_{N \to \infty} \sum_{n=0}^{N} a_n",
        "note": (
            "A series is a sum with no end: a_0 + a_1 + a_2 + ... The sum of the first terms, "
            "up to a_N, is called a partial sum. The value of the series is the number that the "
            "partial sums approach as N grows, if there is such a number. lim names that number. "
            "The pages draw the partial sums"
        ),
    },
    {
        "id": "orthogonal",
        "name": "Waves that do not overlap",
        "tex": r"\int_{-\pi}^{\pi} \sin(mx)\sin(nx)\,dx = 0 \quad (m \ne n)",
        "note": (
            "Two sine waves of different speeds m and n are multiplied and the result is added "
            "up over one turn: the answer is zero. That is why the size of each circle can be "
            "measured on its own"
        ),
    },
]
