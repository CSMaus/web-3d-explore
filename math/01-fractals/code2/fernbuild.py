import numpy as np
from manim import (
    Scene, Dot, Line, Polygon, Rectangle, VGroup,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, ReplacementTransform, Transform,
    TransformFromCopy,
    DOWN, LEFT, RIGHT, UP,
)

import settings
import common
import topic05
from common import BLUE_C, GOLD_C, GREEN_C, MUTED, INK, caption, line_of, txt

MAPS = settings.T5_MAPS
ROLE = topic05.ROLE_COLOURS
XR = settings.T5A_XR
YR = settings.T5A_YR
SCALE = settings.T5A_PLANE_H / (YR[1] - YR[0])
BOX = ((-2.2, 0.0), (2.7, 0.0), (2.7, 10.0), (-2.2, 10.0))


def at(p):
    return np.array([settings.T5A_PLANE_X + (p[0] - (XR[0] + XR[1]) / 2) * SCALE,
                     settings.T5A_PLANE_Y + (p[1] - (YR[0] + YR[1]) / 2) * SCALE, 0])


def frame():
    g = VGroup()
    g.add(Line(at((0, YR[0])), at((0, YR[1])), color=MUTED, stroke_width=settings.STROKE_GRID))
    g.add(Line(at((XR[0], 0)), at((XR[1], 0)), color=MUTED, stroke_width=settings.STROKE_GRID))
    for i in range(int(XR[0]) + 1, int(XR[1]) + 1):
        p = at((i, 0))
        g.add(Line(p + DOWN * settings.T5A_TICK, p + UP * settings.T5A_TICK, color=MUTED))
    for j in range(2, int(YR[1]) + 1, 2):
        p = at((0, j))
        g.add(Line(p + LEFT * settings.T5A_TICK, p + RIGHT * settings.T5A_TICK, color=MUTED))
        g.add(txt(str(j), p[0] - 0.32, p[1], settings.FRAC_SCALE, MUTED))
    g.add(txt("1", at((1, 0))[0], at((0, 0))[1] - 0.3, settings.FRAC_SCALE, MUTED))
    return g


def send(k, p):
    a, b, c, d, e, f = MAPS[k]
    return (a * p[0] + b * p[1] + e, c * p[0] + d * p[1] + f)


def shape_of(pts, colour, fill=settings.T5A_BOX_FILL, width=settings.STROKE_GRID):
    poly = Polygon(*[at(p) for p in pts], color=colour, stroke_width=width)
    poly.set_fill(colour, opacity=fill)
    return poly


def num(v):
    return f"{v:.2f}"


def map_eq(k, y, scale=None):
    scale = scale if scale is not None else settings.T5A_EQ_SCALE
    a, b, c, d, e, f = MAPS[k]
    top = line_of([("x'", GREEN_C), ("=", INK), (num(a), GOLD_C), ("x", BLUE_C), ("+", INK),
                   (num(b), GOLD_C), ("y", BLUE_C), ("+", INK), (num(e), GOLD_C)],
                  settings.T5A_EQ_X, y, scale)
    bot = line_of([("y'", GREEN_C), ("=", INK), (num(c), GOLD_C), ("x", BLUE_C), ("+", INK),
                   (num(d), GOLD_C), ("y", BLUE_C), ("+", INK), (num(f), GOLD_C)],
                  settings.T5A_EQ_X, y - 0.5, scale)
    return VGroup(top, bot)


def step_eq(k, p, row, y):
    a, b, c, d, e, f = MAPS[k]
    coef = (a, b, e) if row == 0 else (c, d, f)
    value = coef[0] * p[0] + coef[1] * p[1] + coef[2]
    tag = "x'" if row == 0 else "y'"
    return line_of([(tag, GREEN_C), ("=", INK), (num(coef[0]), GOLD_C), ("(", INK),
                    (num(p[0]), BLUE_C), (")", INK), ("+", INK), (num(coef[1]), GOLD_C),
                    ("(", INK), (num(p[1]), BLUE_C), (")", INK), ("+", INK),
                    (num(coef[2]), GOLD_C), ("=", INK), (num(value), GREEN_C)],
                   settings.T5A_STEP_X, y, settings.T5A_EQ_SCALE), value


class FernBuild(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("one move takes a point to another point")
        grid = frame()
        self.play(FadeIn(cap), Create(grid))
        self.wait(0.4)

        gen = VGroup(
            line_of([("x'", GREEN_C), ("=", INK), ("a", GOLD_C), ("x", BLUE_C), ("+", INK),
                     ("b", GOLD_C), ("y", BLUE_C), ("+", INK), ("e", GOLD_C)],
                    settings.T5A_EQ_X, settings.T5A_GEN_Y, settings.T5A_EQ_SCALE),
            line_of([("y'", GREEN_C), ("=", INK), ("c", GOLD_C), ("x", BLUE_C), ("+", INK),
                     ("d", GOLD_C), ("y", BLUE_C), ("+", INK), ("f", GOLD_C)],
                    settings.T5A_EQ_X, settings.T5A_GEN_Y - settings.T5A_GEN_DY,
                    settings.T5A_EQ_SCALE),
        )
        self.play(FadeIn(gen[0]))
        self.play(FadeIn(gen[1]))
        legend = VGroup(
            txt("the point that goes in", settings.T5A_EQ_X + 3.6, settings.T5A_GEN_Y,
                settings.NAME_SCALE, BLUE_C),
            txt("the point that comes out", settings.T5A_EQ_X + 3.6,
                settings.T5A_GEN_Y - settings.T5A_GEN_DY, settings.NAME_SCALE, GREEN_C),
            txt("four numbers turn and stretch, two more shift", settings.T5A_EQ_X + 1.7,
                settings.T5A_GEN_Y - 2 * settings.T5A_GEN_DY + 0.15, settings.NAME_SCALE,
                GOLD_C),
        )
        self.play(FadeIn(legend))
        self.wait(0.6)

        box = shape_of(BOX, MUTED, settings.T5A_BOX_FILL * 0.6)
        box_lbl = txt("start with the whole region", at(((BOX[0][0] + BOX[1][0]) / 2, 10.9))[0],
                      at((0, 10.9))[1], settings.NAME_SCALE, MUTED)
        self.play(Create(box), FadeIn(box_lbl))
        self.wait(0.5)
        self.play(FadeOut(legend), FadeOut(gen))

        self.play(Transform(cap, caption("each move sends that whole region somewhere")))
        images = VGroup()
        eq_blocks = VGroup()
        names = VGroup()
        for k in range(4):
            y = settings.T5A_ROW_Y - k * settings.T5A_ROW_DY
            eq = map_eq(k, y)
            name = txt(settings.T5A_ROLE_NAMES[k], settings.T5A_NAME_DX, y - 0.25,
                       settings.NAME_SCALE, ROLE[k])
            img = shape_of([send(k, p) for p in BOX], ROLE[k])
            self.play(FadeIn(eq[0]), run_time=settings.FAST)
            self.play(FadeIn(eq[1]), run_time=settings.FAST)
            self.play(TransformFromCopy(box, img), FadeIn(name),
                      run_time=settings.SLOW if k == 0 else settings.MID)
            images.add(img)
            eq_blocks.add(eq)
            names.add(name)
            self.wait(0.5)
        note = common.top_note("four moves, four pieces, and together they cover the fern")
        self.play(FadeIn(note), FadeOut(box_lbl))
        self.wait(0.8)

        self.play(FadeOut(box))
        self.play(Transform(cap, caption("now send those four pieces through the same four moves")))
        pieces = [[send(k, p) for p in BOX] for k in range(4)]
        current = images
        for level in range(2, settings.T5A_LEVELS + 1):
            pieces = [[send(k, p) for p in piece] for piece in pieces for k in range(4)]
            fresh = VGroup(*[shape_of(piece, BLUE_C, settings.T5A_BOX_FILL, 1)
                             for piece in pieces])
            count = txt(f"{len(pieces)} pieces", settings.T5A_EQ_X + 2.0,
                        settings.T5A_COUNT_Y, settings.EQ_SCALE, BLUE_C)
            self.play(ReplacementTransform(current, fresh), run_time=settings.SLOW)
            self.play(FadeIn(count), run_time=settings.FAST)
            self.wait(settings.T5A_HOLD)
            self.play(FadeOut(count), run_time=settings.FAST)
            current = fresh
        settled = common.top_note("the shape stops changing, and that shape is the fern")
        self.play(FadeOut(note), FadeIn(settled))
        self.wait(1.0)
        self.play(FadeOut(current))

        self.play(FadeOut(settled))
        self.wait(0.4)
        self.play(Transform(cap, caption("one move at a time, chosen at random")))
        bar = VGroup()
        left = settings.T5A_BAR_X - settings.T5A_BAR_W / 2
        for k, prob in enumerate(settings.T5_PROBS):
            seg = Rectangle(width=settings.T5A_BAR_W * prob, height=settings.T5A_BAR_H,
                            stroke_width=0)
            seg.set_fill(ROLE[k], opacity=0.9)
            seg.move_to([left + settings.T5A_BAR_W * prob / 2, settings.T5A_BAR_Y, 0])
            left += settings.T5A_BAR_W * prob
            bar.add(seg)
            if prob >= 0.05:
                bar.add(txt(f"{prob:.0%}", seg.get_center()[0],
                            settings.T5A_BAR_Y + settings.T5A_BAR_H, settings.NAME_SCALE,
                            ROLE[k]))
        self.play(LaggedStart(*[FadeIn(m) for m in bar], lag_ratio=0.2), run_time=settings.MID)
        self.wait(0.8)

        self.play(Transform(cap, caption("take the point, put it through the chosen move")))
        tags = VGroup(*[txt(settings.T5A_ROLE_NAMES[k], settings.T5A_TAG_X,
                            settings.T5A_ROW_Y - k * settings.T5A_TAG_DY,
                            settings.NAME_SCALE, ROLE[k]) for k in range(4)])
        self.play(FadeOut(eq_blocks), FadeOut(names), FadeOut(bar), FadeIn(tags))
        picks = topic05.picks_of(settings.T5_STAGES[-1], settings.T5_SEED)
        here = (0.0, 0.0)
        dot = Dot(at(here), color=BLUE_C, radius=settings.T5_DOT_R)
        here_lbl = txt(f"({num(here[0])}, {num(here[1])})", at(here)[0] + 0.8, at(here)[1],
                       settings.NAME_SCALE, BLUE_C)
        self.play(FadeIn(dot), FadeIn(here_lbl))
        trail = VGroup(dot)
        for i in range(settings.T5A_STEPS_SHOWN):
            k = int(picks[i])
            chosen = map_eq(k, settings.T5A_ROW_Y)
            self.play(Indicate(tags[k], color=ROLE[k]), FadeIn(chosen), run_time=settings.FAST)
            rows = VGroup()
            values = []
            for row in range(2):
                built, value = step_eq(k, here, row,
                                       settings.T5A_STEP_Y - row * settings.T5A_STEP_DY)
                values.append(value)
                rows.add(built)
            self.play(TransformFromCopy(chosen[0], rows[0]), run_time=settings.MID)
            self.play(TransformFromCopy(chosen[1], rows[1]), run_time=settings.MID)
            self.wait(0.5)
            here = (values[0], values[1])
            nxt = Dot(at(here), color=ROLE[k], radius=settings.T5_DOT_R)
            hop = Line(dot.get_center(), nxt.get_center(), color=MUTED, stroke_width=1)
            new_lbl = txt(f"({num(here[0])}, {num(here[1])})", at(here)[0] + 0.8,
                          at(here)[1], settings.NAME_SCALE, ROLE[k])
            self.play(Create(hop), FadeIn(nxt), TransformFromCopy(rows, new_lbl),
                      run_time=settings.MID)
            trail.add(hop, nxt)
            self.wait(0.4)
            self.play(FadeOut(rows), FadeOut(chosen), FadeOut(here_lbl), run_time=settings.FAST)
            here_lbl = new_lbl
            dot = nxt
        self.play(FadeOut(here_lbl))

        self.play(Transform(cap, caption("the same step, over and over")))
        for i in range(settings.T5A_STEPS_SHOWN, settings.T5A_WALK_FAST):
            k = int(picks[i])
            here = send(k, here)
            nxt = Dot(at(here), color=ROLE[k], radius=settings.T5_DOT_R * 0.8)
            hop = Line(dot.get_center(), nxt.get_center(), color=MUTED, stroke_width=1)
            self.play(Create(hop), FadeIn(nxt), run_time=0.22)
            trail.add(hop, nxt)
            dot = nxt

        self.play(FadeOut(trail), FadeOut(tags), FadeOut(grid))
        self.play(Transform(cap, caption("ninety thousand steps, and every dot kept")))
        nx0, nx1, ny0, ny1 = settings.T5_NATIVE
        extent = (at((nx0, ny0))[0], at((nx1, ny0))[0],
                  at((0, ny0))[1], at((0, ny1))[1])
        pts = topic05.run_game(picks)
        shown = None
        for n in settings.T5_STAGES:
            img = topic05.cloud(pts[:n], picks[:n], extent, single=settings.ACCENT_STRUCTURE)
            self.play(FadeIn(img), run_time=settings.MID)
            shown = img
        closing = common.top_note("four moves, a weighted coin, and nothing else")
        self.play(FadeIn(closing), FadeOut(cap))
        self.wait(1.2)
