import numpy as np
from manim import (
    Scene, Arrow, Circle, DashedLine, Dot, Line, Rectangle, Text, VGroup,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, Transform,
    DEGREES, DOWN, LEFT, RIGHT, UP,
)

import settings
import common
from common import BLUE_C, GOLD_C, GREEN_C, CORAL_C, MUTED, caption, poly, txt

RAMP = common.ramp(settings.ESCAPE_GRADIENT, settings.T9_BANDS)


def screen_box(extent, height, centre):
    x0, x1, y0, y1 = extent
    width = height * (x1 - x0) / (y1 - y0)
    return (centre[0] - width / 2, centre[0] + width / 2,
            centre[1] - height / 2, centre[1] + height / 2)


def cgrid(extent, px):
    x0, x1, y0, y1 = extent
    h = max(2, int(px * (y1 - y0) / (x1 - x0)))
    xs = np.linspace(x0, x1, px)
    ys = np.linspace(y1, y0, h)
    return xs[None, :] + 1j * ys[:, None]


def escape_counts(z, c, iters, radius):
    counts = np.full(z.shape, -1, dtype=np.int32)
    alive = np.ones(z.shape, dtype=bool)
    for n in range(iters):
        z[alive] = z[alive] * z[alive] + (c[alive] if isinstance(c, np.ndarray) else c)
        gone = alive & (np.abs(z) > radius)
        counts[gone] = n
        alive &= ~gone
    return counts


def paint_escape(counts, iters, inside_colour=None):
    inside = counts < 0
    frac = np.clip(counts.astype(float) / iters, 0, 1) ** settings.T9_GAMMA
    idx = (frac * (settings.T9_BANDS - 1)).astype(int)
    arr = np.zeros((counts.shape[0], counts.shape[1], 4), dtype=np.uint8)
    arr[..., :3] = RAMP[idx]
    floor = settings.T9_ALPHA_FLOOR
    lift = np.clip((frac - floor) / (1 - floor) * settings.T9_ALPHA_GAIN, 0, 1)
    arr[..., 3] = (lift * 255).astype(np.uint8)
    body = common.rgb(inside_colour if inside_colour else settings.BACKGROUND)
    arr[inside, :3] = body
    arr[inside, 3] = 255
    return arr


def julia_image(c, extent, box, iters=None):
    iters = iters if iters is not None else settings.T9_ITERS
    z = cgrid(extent, settings.T9_PX)
    counts = escape_counts(z, complex(c[0], c[1]), iters, settings.T9_RADIUS)
    return common.image_at(paint_escape(counts, iters), box)


def mandel_image(extent, box, iters=None, inside_colour=None):
    iters = iters if iters is not None else settings.T9_ITERS
    c = cgrid(extent, settings.T9_PX)
    counts = escape_counts(np.zeros_like(c), c, iters, settings.T9_RADIUS)
    return common.image_at(paint_escape(counts, iters, inside_colour), box)


def flat_set_image(extent, box, iters=None):
    iters = iters if iters is not None else settings.T9_ITERS
    c = cgrid(extent, settings.T9_PX)
    counts = escape_counts(np.zeros_like(c), c, iters, settings.T9_RADIUS)
    arr = np.zeros((counts.shape[0], counts.shape[1], 4), dtype=np.uint8)
    arr[..., :3] = common.rgb(settings.ACCENT_STRUCTURE)
    arr[..., 3] = np.where(counts < 0, 255, 0)
    return common.image_at(arr, box)


class Frame:
    def __init__(self, unit, centre, xr, yr):
        self.unit = unit
        self.centre = np.array([centre[0], centre[1], 0])
        self.xr = xr
        self.yr = yr

    def at(self, z):
        return self.centre + np.array([z[0] * self.unit, z[1] * self.unit, 0])

    def build(self):
        g = VGroup()
        g.add(Arrow(self.at((-self.xr - 0.3, 0)), self.at((self.xr + 0.3, 0)), color=MUTED,
                    buff=0, stroke_width=settings.STROKE_GRID))
        g.add(Arrow(self.at((0, -self.yr - 0.3)), self.at((0, self.yr + 0.3)), color=MUTED,
                    buff=0, stroke_width=settings.STROKE_GRID))
        for i in range(-self.xr, self.xr + 1):
            if i:
                p = self.at((i, 0))
                g.add(Line(p + DOWN * settings.T8_TICK, p + UP * settings.T8_TICK, color=MUTED))
        for j in range(-self.yr, self.yr + 1):
            if j:
                p = self.at((0, j))
                g.add(Line(p + LEFT * settings.T8_TICK, p + RIGHT * settings.T8_TICK,
                           color=MUTED))
        return g


def orbit_of(z0, c, steps):
    z = complex(z0[0], z0[1])
    cc = complex(c[0], c[1])
    out = [(z.real, z.imag)]
    for _ in range(steps):
        z = z * z + cc
        out.append((z.real, z.imag))
    return out


class StepPlot:
    def __init__(self, x, y, w, h, steps, top):
        self.ox = x - w / 2
        self.oy = y
        self.w = w
        self.h = h
        self.steps = steps
        self.top = top

    def at(self, step, dist):
        return np.array([self.ox + self.w * step / self.steps,
                         self.oy + self.h * min(dist, self.top) / self.top, 0])

    def build(self):
        g = VGroup()
        g.add(Line([self.ox, self.oy, 0], [self.ox + self.w, self.oy, 0], color=MUTED,
                   stroke_width=settings.STROKE_GRID))
        g.add(Line([self.ox, self.oy, 0], [self.ox, self.oy + self.h, 0], color=MUTED,
                   stroke_width=settings.STROKE_GRID))
        g.add(txt("step", self.ox + self.w / 2, self.oy - 0.3, settings.AXLBL_SCALE, MUTED))
        mark = Text("distance from 0", color=MUTED).scale(settings.AXLBL_SCALE)
        mark.rotate(90 * DEGREES).move_to([self.ox - 0.28, self.oy + self.h / 2, 0])
        g.add(mark)
        return g

    def limit(self):
        a = self.at(0, settings.T9_RADIUS)
        b = self.at(self.steps, settings.T9_RADIUS)
        line = DashedLine(a, b, color=GOLD_C, stroke_width=settings.STROKE_GRID)
        lbl = txt("2", b[0] + 0.22, b[1], settings.AXLBL_SCALE, GOLD_C)
        return VGroup(line, lbl)

    def trace(self, walk, colour):
        pts = [self.at(i, float(np.hypot(*p))) for i, p in enumerate(walk)]
        dots = VGroup(*[Dot(q, color=colour, radius=settings.T9_PLOT_DOT_R) for q in pts])
        return dots, poly(pts, colour, 1)


class OrbitWalk(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        fr = Frame(settings.T9_UNIT, (settings.T9_ORB_X, settings.T9_ORB_Y),
                   settings.T9_ORB_XR, settings.T9_ORB_YR)
        c = settings.T9_ORB_C
        walk = orbit_of(settings.T9_ORB_Z, c, settings.T9_ORB_STEPS)

        cap = caption("one rule, applied over and over")
        rule = txt("z becomes z × z + c", settings.T9_RULE_TOP_X, settings.T9_RULE_TOP_Y,
                   settings.FORMULA_SCALE, MUTED,
                   [(0, 1, BLUE_C), (8, 9, BLUE_C), (10, 11, BLUE_C), (12, 13, GOLD_C)])
        self.play(FadeIn(cap), Create(fr.build()))
        self.play(FadeIn(rule))
        c_dot = Dot(fr.at(c), color=GOLD_C, radius=settings.T8_DOT_R)
        c_lbl = txt(f"c = {c[0]:g} + {c[1]:g}i", fr.at(c)[0] - 1.2, fr.at(c)[1] + 1.0,
                    settings.EQ_SCALE, GOLD_C)
        self.play(FadeIn(c_dot), FadeIn(c_lbl))
        self.wait(0.3)

        plot = StepPlot(settings.T9_PLOT_X, settings.T9_PLOT_Y, settings.T9_PLOT_W,
                        settings.T9_PLOT_H, settings.T9_ORB_STEPS, settings.T9_PLOT_TOP)
        self.play(Create(plot.build()))
        self.play(Create(plot.limit()))

        dot = Dot(fr.at(walk[0]), color=BLUE_C, radius=settings.T8_DOT_R)
        start_lbl = txt("z", fr.at(walk[0])[0] + 0.3, fr.at(walk[0])[1] + 0.25,
                        settings.EQ_SCALE, BLUE_C)
        self.play(FadeIn(dot), FadeIn(start_lbl))
        step_read = common.readout("step:", "0", settings.T9_ROW_X, settings.T9_ROW_Y, BLUE_C)
        z_read = common.readout("z =", f"{walk[0][0]:.2f} + {walk[0][1]:.2f}i",
                                settings.T9_ROW_X, settings.T9_ROW_Y - settings.T9_ROW_DY,
                                BLUE_C)
        d_read = common.readout("distance from 0:", f"{np.hypot(*walk[0]):.2f}",
                                settings.T9_ROW_X, settings.T9_ROW_Y - 2 * settings.T9_ROW_DY,
                                GREEN_C)
        self.play(FadeIn(step_read), FadeIn(z_read), FadeIn(d_read))
        first = Dot(plot.at(0, float(np.hypot(*walk[0]))), color=BLUE_C,
                    radius=settings.T9_PLOT_DOT_R)
        self.play(FadeIn(first))
        self.wait(0.4)

        here = dot
        last = plot.at(0, float(np.hypot(*walk[0])))
        for i, (p, q) in enumerate(zip(walk, walk[1:]), start=1):
            hop = Line(fr.at(p), fr.at(q), color=BLUE_C, stroke_width=1)
            landed = Dot(fr.at(q), color=BLUE_C, radius=settings.T8_DOT_R)
            faded = here.copy().set_opacity(settings.T9_TRAIL_DIM)
            reach = float(np.hypot(*q))
            nxt = plot.at(i, reach)
            leg = Line(last, nxt, color=BLUE_C, stroke_width=1)
            mark = Dot(nxt, color=BLUE_C, radius=settings.T9_PLOT_DOT_R)
            self.play(
                Create(hop), FadeIn(landed), Transform(here, faded),
                Create(leg), FadeIn(mark),
                Transform(step_read[1], common.value_like(step_read, f"{i}", BLUE_C)),
                Transform(z_read[1], common.value_like(
                    z_read, f"{q[0]:.2f} + {q[1]:.2f}i", BLUE_C)),
                Transform(d_read[1], common.value_like(d_read, f"{reach:.2f}", GREEN_C)),
                run_time=settings.MID if i < 3 else settings.FAST,
            )
            here = landed
            last = nxt
        held = txt("the distance never reaches 2", settings.T9_ROW_X + 1.7,
                   settings.T9_ROW_Y - 3.2 * settings.T9_ROW_DY, settings.EQ_SCALE, GREEN_C)
        self.play(FadeIn(held))
        note = common.top_note("each step turns the point and shifts it by c")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class EscapeTest(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        fr = Frame(settings.T9_UNIT, (settings.T9_ORB_X, settings.T9_ORB_Y),
                   settings.T9_ORB_XR, settings.T9_ORB_YR)
        c = settings.T9_ORB_C

        cap = caption("cross the circle once and the point is gone for good")
        ring = Circle(radius=settings.T9_RADIUS * settings.T9_UNIT, arc_center=fr.at((0, 0)),
                      color=GOLD_C, stroke_width=settings.STROKE_GRID)
        diag = settings.T9_RADIUS * np.sqrt(0.5)
        ring_lbl = txt("distance 2", fr.at((diag, diag))[0] + 0.55,
                       fr.at((diag, diag))[1] + 0.2, settings.NAME_SCALE, GOLD_C)
        self.play(FadeIn(cap), Create(fr.build()), Create(ring), FadeIn(ring_lbl))
        plot = StepPlot(settings.T9_PLOT_X, settings.T9_PLOT_Y, settings.T9_PLOT_W,
                        settings.T9_PLOT_H, settings.T9_ESC_STEPS, settings.T9_PLOT_TOP)
        self.play(Create(plot.build()))
        self.play(Create(plot.limit()))
        self.wait(0.3)

        for start, colour, tag, row in ((settings.T9_ESC_Z, CORAL_C, "escaped", 0),
                                        (settings.T9_ORB_Z, GREEN_C, "stayed", 1)):
            walk = orbit_of(start, c, settings.T9_ESC_STEPS)
            kept = [walk[0]]
            for p in walk[1:]:
                kept.append(p)
                if np.hypot(*p) > settings.T9_RADIUS * 1.6:
                    break
            dots = VGroup(*[Dot(fr.at(p), color=colour, radius=settings.T8_DOT_R * 0.8)
                            for p in kept])
            path = poly([fr.at(p) for p in kept], colour, 1)
            read = common.readout("distance:", f"{np.hypot(*kept[0]):.2f}",
                                  settings.T9_ROW_X,
                                  settings.T9_ROW_Y - row * settings.T9_ROW_DY, colour)
            self.play(FadeIn(read), FadeIn(dots[0]), run_time=settings.FAST)
            trail = None
            for i in range(1, len(kept)):
                reach = float(np.hypot(*kept[i]))
                leg = Line(plot.at(i - 1, float(np.hypot(*kept[i - 1]))),
                           plot.at(i, reach), color=colour, stroke_width=1)
                mark = Dot(plot.at(i, reach), color=colour,
                           radius=settings.T9_PLOT_DOT_R)
                piece = Line(fr.at(kept[i - 1]), fr.at(kept[i]), color=colour,
                             stroke_width=1)
                self.play(Create(piece), FadeIn(dots[i]), Create(leg), FadeIn(mark),
                          Transform(read[1], common.value_like(read, f"{reach:.2f}", colour)),
                          run_time=settings.FAST)
                trail = piece
            lbl = txt(tag, settings.T9_TAG_X,
                      settings.T9_ROW_Y - row * settings.T9_ROW_DY, settings.EQ_SCALE, colour)
            self.play(FadeIn(lbl), run_time=settings.FAST)
            self.wait(0.4)
        rule = txt("past 2 the distance only grows", settings.T9_ROW_X + 1.9,
                   settings.T9_ROW_Y - 2.4 * settings.T9_ROW_DY, settings.EQ_SCALE, MUTED)
        self.play(FadeIn(rule))
        note = common.top_note("two kinds of starting point, and nothing in between")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def edge_point(p, q, x0, x1, y0, y1):
    t = 1.0
    for a, b, lo, hi in ((p[0], q[0], x0, x1), (p[1], q[1], y0, y1)):
        d = b - a
        if d > 0:
            t = min(t, (hi - a) / d)
        elif d < 0:
            t = min(t, (lo - a) / d)
    t = max(t, 0.0)
    return (p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]))


def clipped_walk(walk, extent, limit):
    x0, x1, y0, y1 = extent
    out = [walk[0]]
    for p, q in zip(walk, walk[1:limit]):
        if x0 <= q[0] <= x1 and y0 <= q[1] <= y1:
            out.append(q)
        else:
            out.append(edge_point(p, q, x0, x1, y0, y1))
            break
    return out


def fate_of(z0, c, iters=None, radius=None):
    iters = iters if iters is not None else settings.T9_ITERS
    radius = radius if radius is not None else settings.T9_RADIUS
    z = complex(z0[0], z0[1])
    cc = complex(c[0], c[1])
    walk = [z0]
    for n in range(1, iters + 1):
        z = z * z + cc
        walk.append((z.real, z.imag))
        if abs(z) > radius:
            return n, walk
    return -1, walk


class JuliaSet(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        c = settings.T9_CS[0]
        box = screen_box(settings.T9_JULIA, settings.T9_SET_H,
                         (settings.T9_SET_X, settings.T9_SET_Y))
        x0, x1, y0, y1 = settings.T9_JULIA

        def spot(z):
            return np.array([box[0] + (z[0] - x0) / (x1 - x0) * (box[1] - box[0]),
                             box[2] + (z[1] - y0) / (y1 - y0) * (box[3] - box[2]), 0])

        cap = caption("try one starting point at a time")
        frame = Rectangle(width=box[1] - box[0], height=box[3] - box[2], color=MUTED,
                          stroke_width=settings.STROKE_GRID)
        frame.move_to([(box[0] + box[1]) / 2, (box[2] + box[3]) / 2, 0])
        c_read = txt(f"c = {c[0]:g} + {c[1]:g}i", settings.T9_JS_ROW_X,
                     settings.T9_JS_ROW_Y + settings.T9_JS_ROW_DY, settings.EQ_SCALE, GOLD_C)
        self.play(FadeIn(cap), Create(frame), FadeIn(c_read))
        self.wait(0.3)

        tried = VGroup()
        rows = VGroup()
        for i, z0 in enumerate(settings.T9_JS_SAMPLES):
            steps, walk = fate_of(z0, c)
            colour = GREEN_C if steps < 0 else CORAL_C
            inside = clipped_walk(walk, settings.T9_JULIA, settings.T9_JS_TRAIL)
            dot = Dot(spot(z0), color=colour, radius=settings.T8_DOT_R)
            trail = poly([spot(p) for p in inside], colour, 1) if len(inside) > 1 else None
            tag = "stays" if steps < 0 else f"left after {steps}"
            row = txt(f"{z0[0]:g} + {z0[1]:g}i    {tag}", settings.T9_JS_ROW_X,
                      settings.T9_JS_ROW_Y - i * settings.T9_JS_ROW_DY, settings.EQ_SCALE,
                      colour)
            rows.add(row)
            tried.add(dot)
            if trail is not None:
                tried.add(trail)
                self.play(FadeIn(dot), Create(trail), FadeIn(row), run_time=settings.FAST)
            else:
                self.play(FadeIn(dot), FadeIn(row), run_time=settings.FAST)
            self.wait(0.25)
        self.wait(0.4)

        self.play(Transform(cap, caption("now do that for every starting point in the frame")),
                  FadeOut(rows), FadeOut(tried))
        z = cgrid(settings.T9_JULIA, settings.T9_PX)
        counts = escape_counts(z, complex(c[0], c[1]), settings.T9_ITERS, settings.T9_RADIUS)
        arr = np.zeros((counts.shape[0], counts.shape[1], 4), dtype=np.uint8)
        arr[..., :3] = common.rgb(settings.ACCENT_STRUCTURE)
        arr[..., 3] = np.where(counts < 0, 255, 0)
        filled = common.image_at(arr, box)
        self.play(FadeIn(filled), run_time=settings.SLOW)
        kept_frac = float((counts < 0).mean())
        held = txt(f"{kept_frac * 100:.0f} per cent of the frame stays",
                   settings.T9_JS_ROW_X, settings.T9_JS_ROW_Y, settings.EQ_SCALE, BLUE_C)
        name = txt("the Julia set for this c", settings.T9_JS_ROW_X,
                   settings.T9_JS_ROW_Y - settings.T9_JS_ROW_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(held))
        self.play(FadeIn(name))
        self.wait(0.5)
        coloured = julia_image(c, settings.T9_JULIA, box)
        self.play(FadeIn(coloured), run_time=settings.MID)
        note = common.top_note("the boundary between staying and leaving")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class JuliaMorph(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        box = screen_box(settings.T9_JULIA, settings.T9_SET_H,
                         (settings.T9_SET_X, settings.T9_SET_Y))
        mini_box = screen_box(settings.T9_MAND, settings.T9_MINI_H,
                              (settings.T9_MINI_X, settings.T9_MINI_Y))
        mini_set = flat_set_image(settings.T9_MAND, mini_box)
        mini_edge = Rectangle(width=mini_box[1] - mini_box[0], height=mini_box[3] - mini_box[2],
                              color=MUTED, stroke_width=settings.STROKE_GRID)
        mini_edge.move_to([(mini_box[0] + mini_box[1]) / 2, (mini_box[2] + mini_box[3]) / 2, 0])

        def mini_at(c):
            x0, x1, y0, y1 = settings.T9_MAND
            return np.array([mini_box[0] + (c[0] - x0) / (x1 - x0) * (mini_box[1] - mini_box[0]),
                             mini_box[2] + (c[1] - y0) / (y1 - y0) * (mini_box[3] - mini_box[2]),
                             0])

        cap = caption("move c, and the shape changes with it")
        mini_lbl = txt("where c sits on the map", settings.T9_MINI_X,
                       mini_box[2] - settings.T9_MINI_LBL_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(cap), FadeIn(mini_set), Create(mini_edge), FadeIn(mini_lbl))
        c_mark = Dot(mini_at(settings.T9_CS[0]), color=GOLD_C, radius=settings.T8_DOT_R)
        self.play(FadeIn(c_mark))
        shown = None
        read = common.readout("c =", f"{settings.T9_CS[0][0]:g} + {settings.T9_CS[0][1]:g}i",
                              settings.T9_READ_X, settings.T9_READ_Y, GOLD_C)
        self.play(FadeIn(read))
        for k, c in enumerate(settings.T9_CS):
            img = julia_image(c, settings.T9_JULIA, box)
            anims = [FadeIn(img),
                     c_mark.animate.move_to(mini_at(c)),
                     Transform(read[1], common.value_like(
                         read, f"{c[0]:g} + {c[1]:g}i", GOLD_C))]
            if shown is not None:
                anims.append(FadeOut(shown))
            self.play(*anims, run_time=settings.MID)
            shown = img
            self.wait(0.4)
        note = common.top_note("one connected piece, or scattered dust")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class MandelbrotAtlas(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        box = screen_box(settings.T9_MAND, settings.T9_SET_H,
                         (settings.T9_SET_X, settings.T9_SET_Y))

        cap = caption("for every c, test the walk that starts at zero")
        frame = Rectangle(width=box[1] - box[0], height=box[3] - box[2], color=MUTED,
                          stroke_width=settings.STROKE_GRID)
        frame.move_to([(box[0] + box[1]) / 2, (box[2] + box[3]) / 2, 0])
        self.play(FadeIn(cap), Create(frame))
        flat = flat_set_image(settings.T9_MAND, box)
        self.play(FadeIn(flat), run_time=settings.SLOW)
        name = txt("the Mandelbrot set", settings.T9_SET_X, settings.T9_NAME_Y,
                   settings.EQ_SCALE, BLUE_C)
        self.play(FadeIn(name))
        self.wait(0.5)

        jbox_in = screen_box(settings.T9_JULIA, settings.T9_INSET_H,
                             (settings.T9_INSET_X, settings.T9_INSET_Y))
        jbox_out = screen_box(settings.T9_JULIA, settings.T9_INSET_H,
                              (settings.T9_INSET_X, -settings.T9_INSET_Y))
        for c, jbox, tag, colour in ((settings.T9_DOOR_IN, jbox_in, "inside, one piece", GREEN_C),
                                     (settings.T9_DOOR_OUT, jbox_out, "outside, dust", CORAL_C)):
            x0, x1, y0, y1 = settings.T9_MAND
            px = box[0] + (c[0] - x0) / (x1 - x0) * (box[1] - box[0])
            py = box[2] + (c[1] - y0) / (y1 - y0) * (box[3] - box[2])
            mark = Dot([px, py, 0], color=colour, radius=settings.T8_DOT_R)
            link = Line([px, py, 0], [jbox[0], (jbox[2] + jbox[3]) / 2, 0], color=MUTED,
                        stroke_width=1)
            small = julia_image(c, settings.T9_JULIA, jbox)
            edge = Rectangle(width=jbox[1] - jbox[0], height=jbox[3] - jbox[2], color=colour,
                             stroke_width=settings.STROKE_GRID)
            edge.move_to([(jbox[0] + jbox[1]) / 2, (jbox[2] + jbox[3]) / 2, 0])
            lbl = txt(tag, (jbox[0] + jbox[1]) / 2, jbox[2] - 0.3, settings.NAME_SCALE, colour)
            self.play(FadeIn(mark), Create(link), run_time=settings.FAST)
            self.play(FadeIn(small), Create(edge), FadeIn(lbl), run_time=settings.MID)
            self.wait(0.5)
        note = common.top_note("every point of this map is a doorway to a whole Julia set")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def escape_steps(c, iters=None, radius=None):
    iters = iters if iters is not None else settings.T9_ITERS
    radius = radius if radius is not None else settings.T9_RADIUS
    z = 0j
    cc = complex(c[0], c[1])
    for n in range(1, iters + 1):
        z = z * z + cc
        if abs(z) > radius:
            return n
    return -1


def key_frac(steps, iters=None):
    iters = iters if iters is not None else settings.T9_ITERS
    return float(np.clip(steps / iters, 0, 1) ** settings.T9_GAMMA)


class EscapeColour(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        box = screen_box(settings.T9_MAND, settings.T9_SET_H,
                         (settings.T9_SET_X, settings.T9_SET_Y))
        x0, x1, y0, y1 = settings.T9_MAND

        def spot(c):
            return np.array([box[0] + (c[0] - x0) / (x1 - x0) * (box[1] - box[0]),
                             box[2] + (c[1] - y0) / (y1 - y0) * (box[3] - box[2]), 0])

        cap = caption("every point outside leaves, but some take longer")
        flat = flat_set_image(settings.T9_MAND, box)
        self.play(FadeIn(cap), FadeIn(flat))
        self.wait(0.4)

        counts = []
        marks = VGroup()
        rows = VGroup()
        for i, c in enumerate(settings.T9_SAMPLES):
            steps = escape_steps(c)
            counts.append(steps)
            colour = common.hexof(RAMP[int(key_frac(steps) * (settings.T9_BANDS - 1))])
            dot = Dot(spot(c), color=colour, radius=settings.T8_DOT_R)
            row = txt(f"c = {c[0]:g} + {c[1]:g}i    left after {steps} steps",
                      settings.T9_SAMPLE_X, settings.T9_SAMPLE_Y - i * settings.T9_SAMPLE_DY,
                      settings.EQ_SCALE, colour)
            marks.add(dot)
            rows.add(row)
            self.play(FadeIn(dot), run_time=settings.FAST)
            self.play(FadeIn(row), run_time=settings.FAST)
            self.wait(0.3)
        closer = txt("closer to the edge, longer to leave",
                     settings.T9_SAMPLE_X,
                     settings.T9_SAMPLE_Y - len(settings.T9_SAMPLES) * settings.T9_SAMPLE_DY,
                     settings.EQ_SCALE, MUTED)
        self.play(FadeIn(closer))
        self.wait(0.5)

        self.play(Transform(cap, caption("give every outside point the colour of its count")))
        key = VGroup()
        for i in range(settings.T9_KEY_N):
            t = i / (settings.T9_KEY_N - 1)
            col = RAMP[int(t * (settings.T9_BANDS - 1))]
            band = Rectangle(width=settings.T9_KEY_W, height=settings.T9_KEY_H, stroke_width=0)
            band.set_fill(common.hexof(col), opacity=1)
            band.move_to([settings.T9_KEY_X, settings.T9_KEY_Y + i * settings.T9_KEY_H, 0])
            key.add(band)
        fast = txt("leaves at once", settings.T9_KEY_X + settings.T9_KEY_LBL_DX,
                   settings.T9_KEY_Y, settings.NAME_SCALE, MUTED)
        slow = txt("takes many steps", settings.T9_KEY_X + settings.T9_KEY_LBL_DX,
                   settings.T9_KEY_Y + (settings.T9_KEY_N - 1) * settings.T9_KEY_H,
                   settings.NAME_SCALE, MUTED)
        self.play(FadeOut(rows), FadeOut(closer), FadeIn(key), FadeIn(fast), FadeIn(slow))

        low = settings.T9_KEY_Y - settings.T9_KEY_H / 2
        span = settings.T9_KEY_N * settings.T9_KEY_H
        ticks = VGroup()
        for c, steps in zip(settings.T9_SAMPLES, counts):
            y = low + key_frac(steps) * span
            colour = common.hexof(RAMP[int(key_frac(steps) * (settings.T9_BANDS - 1))])
            line = Line([settings.T9_KEY_X - settings.T9_KEY_W / 2
                         - settings.T9_KEY_TICK_DX, y, 0],
                        [settings.T9_KEY_X - settings.T9_KEY_W / 2, y, 0], color=colour,
                        stroke_width=settings.STROKE_GRID + 1)
            lbl = txt(f"{steps}", settings.T9_KEY_NUM_X, y, settings.NAME_SCALE, colour)
            ticks.add(line, lbl)
        self.play(FadeIn(ticks), run_time=settings.MID)
        self.wait(0.4)

        coloured = mandel_image(settings.T9_MAND, box)
        self.play(FadeIn(coloured), run_time=settings.SLOW)
        self.remove(flat)
        self.bring_to_front(marks)
        self.wait(0.5)
        note = common.top_note("the colours are a reading of the escape count")
        self.play(FadeIn(note), FadeOut(cap), FadeOut(marks))
        self.wait(1)


def newton_image(extent, box, iters=None):
    iters = iters if iters is not None else settings.T9_NEWTON_ITERS
    z = cgrid(extent, settings.T9_PX)
    roots = np.array([1.0 + 0j, -0.5 + 0.8660254j, -0.5 - 0.8660254j])
    taken = np.full(z.shape, iters, dtype=np.int32)
    for n in range(iters):
        z = z - (z ** 3 - 1) / (3 * z ** 2 + 1e-12)
        near = np.min(np.stack([np.abs(z - r) for r in roots], axis=0), axis=0)
        fresh = (taken == iters) & (near < settings.T9_NEWTON_TOL)
        taken[fresh] = n
    dist = np.stack([np.abs(z - r) for r in roots], axis=0)
    which = np.argmin(dist, axis=0)
    palette = [common.rgb(settings.ACCENT_STRUCTURE), common.rgb(settings.ACCENT_MATH),
               common.rgb(settings.ACCENT_STABLE)]
    shade = 1 - settings.T9_NEWTON_DIM * np.clip(taken / iters, 0, 1) ** 0.35
    arr = np.zeros((z.shape[0], z.shape[1], 4), dtype=np.uint8)
    for k in range(3):
        pick = which == k
        arr[pick, :3] = (palette[k][None, :] * shade[pick][:, None]).astype(np.uint8)
    arr[..., 3] = 255
    return common.image_at(arr, box)


def ship_image(extent, box, iters=None):
    iters = iters if iters is not None else settings.T9_ITERS
    c = cgrid(extent, settings.T9_PX)
    z = np.zeros_like(c)
    counts = np.full(c.shape, -1, dtype=np.int32)
    alive = np.ones(c.shape, dtype=bool)
    for n in range(iters):
        zr = np.abs(z.real)
        zi = np.abs(z.imag)
        z = np.where(alive, (zr + 1j * zi) ** 2 + c, z)
        gone = alive & (np.abs(z) > settings.T9_RADIUS)
        counts[gone] = n
        alive &= ~gone
    arr = paint_escape(counts, iters, settings.ACCENT_STRUCTURE)
    return common.image_at(arr[::-1], box)


class NewtonAndShip(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        left = screen_box(settings.T9_NEWTON, settings.T9_PAIR_H,
                          (-settings.T9_PAIR_DX, settings.T9_PAIR_Y))
        right = screen_box(settings.T9_SHIP, settings.T9_PAIR_H,
                           (settings.T9_PAIR_DX, settings.T9_PAIR_Y))

        cap = caption("the same idea, two other rules")
        newton = newton_image(settings.T9_NEWTON, left)
        lbl_a = txt("which root the walk falls into", -settings.T9_PAIR_DX,
                    settings.T9_PAIR_LBL_Y, settings.NAME_SCALE, MUTED)
        eq_a = txt("z becomes z - (z³ - 1) / 3z²", -settings.T9_PAIR_DX,
                   settings.T9_PAIR_EQ_Y, settings.EQ_SCALE, common.INK,
                   [(0, 1, BLUE_C), (8, 9, BLUE_C), (11, 12, BLUE_C), (17, 18, BLUE_C)])
        name_a = txt("Newton's method on z³ = 1", -settings.T9_PAIR_DX,
                     settings.T9_PAIR_NAME_Y, settings.EQ_SCALE, MUTED)
        self.play(FadeIn(cap), FadeIn(newton), run_time=settings.MID)
        self.play(FadeIn(name_a), FadeIn(lbl_a), FadeIn(eq_a))
        self.wait(0.5)
        ship = ship_image(settings.T9_SHIP, right)
        lbl_b = txt("the same test with absolute values", settings.T9_PAIR_DX,
                    settings.T9_PAIR_LBL_Y, settings.NAME_SCALE, MUTED)
        eq_b = txt("z becomes (|x| + |y|i)² + c", settings.T9_PAIR_DX,
                   settings.T9_PAIR_EQ_Y, settings.EQ_SCALE, common.INK,
                   [(0, 1, BLUE_C), (9, 10, BLUE_C), (12, 13, BLUE_C), (17, 18, GOLD_C)])
        name_b = txt("the burning ship", settings.T9_PAIR_DX, settings.T9_PAIR_NAME_Y,
                     settings.EQ_SCALE, MUTED)
        self.play(FadeIn(ship), run_time=settings.MID)
        self.play(FadeIn(name_b), FadeIn(lbl_b), FadeIn(eq_b))
        self.wait(0.5)
        edge = VGroup(
            Rectangle(width=left[1] - left[0], height=left[3] - left[2], color=MUTED,
                      stroke_width=settings.STROKE_GRID).move_to(
                          [(left[0] + left[1]) / 2, (left[2] + left[3]) / 2, 0]),
            Rectangle(width=right[1] - right[0], height=right[3] - right[2], color=MUTED,
                      stroke_width=settings.STROKE_GRID).move_to(
                          [(right[0] + right[1]) / 2, (right[2] + right[3]) / 2, 0]),
        )
        self.play(Create(edge))
        said = txt("x and y are the two parts of z, and the rule is otherwise unchanged",
                   0, settings.T9_PAIR_NOTE_Y, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(said), FadeOut(cap), Indicate(VGroup(eq_a, eq_b), color=GOLD_C))
        note = common.top_note("a fractal boundary wherever two outcomes meet")
        self.play(FadeIn(note))
        self.wait(1)
