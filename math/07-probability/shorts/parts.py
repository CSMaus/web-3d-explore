from manim import DashedLine, Dot, Line, Polygon, Rectangle, Square, VGroup, VMobject

import layout
import settings

U = settings.STAGE_UNIT
THIN = 0.02
PIP_STEP = 0.27
PIP_SIZE = 0.09
DIE_STROKE = 3
DIE_ROUND = 0.15
BAR_GAP = 0.15
PIPS = {
    1: [(0, 0)],
    2: [(-1, 1), (1, -1)],
    3: [(-1, 1), (0, 0), (1, -1)],
    4: [(-1, 1), (1, 1), (-1, -1), (1, -1)],
    5: [(-1, 1), (1, 1), (0, 0), (-1, -1), (1, -1)],
    6: [(-1, 1), (1, 1), (-1, 0), (1, 0), (-1, -1), (1, -1)],
}


def box(x0: float, y0: float, x1: float, y1: float, colour: str, fill: float = 1.0, stroke: float = 0.0) -> Rectangle:
    rect = Rectangle(width=max(x1 - x0, THIN) * U, height=max(y1 - y0, THIN) * U)
    rect.set_fill(colour, fill).set_stroke(colour, stroke)
    rect.move_to(layout.S((x0 + x1) / 2, (y0 + y1) / 2))
    return rect


def line(a, b, colour: str, width: float = 2, dashed: bool = False):
    kind = DashedLine if dashed else Line
    return kind(layout.S(*a), layout.S(*b)).set_stroke(colour, width)


def path(points, colour: str, width: float = 2) -> VMobject:
    made = VMobject()
    made.set_points_as_corners([layout.S(x, y) for x, y in points])
    return made.set_stroke(colour, width)


def area(points, colour: str, fill: float) -> Polygon:
    return Polygon(*[layout.S(x, y) for x, y in points]).set_fill(colour, fill).set_stroke(colour, 0)


def text(words: str, size: float, colour: str, at):
    return layout.label(words, size * U, colour).move_to(layout.S(*at))


def dot(at, radius: float, colour: str) -> Dot:
    return Dot(layout.S(*at), radius=radius * U, color=colour)


def die(centre, side: float, face: int, colour: str = settings.INK) -> VGroup:
    body = Square(side_length=side * U).set_stroke(colour, DIE_STROKE).set_fill(settings.BACKGROUND, 1)
    body.round_corners(side * U * DIE_ROUND)
    body.move_to(layout.S(*centre))
    pips = VGroup(*[
        dot((centre[0] + px * side * PIP_STEP, centre[1] + py * side * PIP_STEP), side * PIP_SIZE, colour)
        for px, py in PIPS[face]
    ])
    return VGroup(body, pips)


def bars(heights, x0: float, x1: float, y0: float, top: float, colours, most: float | None = None, fill: float = 1.0) -> VGroup:
    step = (x1 - x0) / len(heights)
    most = most or max(heights)
    made = VGroup()
    for i, height in enumerate(heights):
        colour = colours if isinstance(colours, str) else colours[i]
        left = x0 + step * i + step * BAR_GAP / 2
        made.add(box(left, y0, left + step * (1 - BAR_GAP), y0 + (top - y0) * height / most, colour, fill))
    return made
