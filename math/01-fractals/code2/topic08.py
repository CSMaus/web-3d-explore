import numpy as np
from manim import (
    Scene, Arc, Arrow, Circle, DashedLine, Dot, Line, Rectangle, VGroup, ValueTracker,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, Transform, TransformFromCopy,
    always_redraw,
    DEGREES, DOWN, LEFT, RIGHT, UP,
)

import settings
import common
import topic09
from common import BLUE_C, GOLD_C, GREEN_C, CORAL_C, MUTED, caption, poly, txt

UNIT = settings.T8_UNIT
CENTRE = np.array([settings.T8_CX, settings.T8_CY, 0])


def at(z):
    return CENTRE + np.array([z[0] * UNIT, z[1] * UNIT, 0])


def real_axis(zero=True):
    xr = settings.T8_XR
    g = VGroup()
    g.add(Arrow(at((-xr - 0.3, 0)), at((xr + 0.3, 0)), color=MUTED, buff=0,
                stroke_width=settings.STROKE_GRID))
    for i in range(-xr, xr + 1):
        if i == 0:
            continue
        p = at((i, 0))
        g.add(Line(p + DOWN * settings.T8_TICK, p + UP * settings.T8_TICK, color=MUTED))
    g.add(txt("real", at((xr + 0.3, 0))[0], at((0, 0))[1] - 0.4, settings.T8_LBL_SCALE, MUTED))
    if zero:
        g.add(txt("0", at((0, 0))[0] - 0.25, at((0, 0))[1] - 0.3, settings.T8_LBL_SCALE, MUTED))
    return g


def imag_axis():
    yr = settings.T8_YR
    g = VGroup()
    g.add(Arrow(at((0, -yr - 0.3)), at((0, yr + 0.3)), color=MUTED, buff=0,
                stroke_width=settings.STROKE_GRID))
    for j in range(-yr, yr + 1):
        if j == 0:
            continue
        p = at((0, j))
        g.add(Line(p + LEFT * settings.T8_TICK, p + RIGHT * settings.T8_TICK, color=MUTED))
    g.add(txt("imaginary", at((0, 0))[0] + 0.9, at((0, yr + 0.3))[1], settings.T8_LBL_SCALE,
              MUTED))
    return g


def plane(zero=True):
    return VGroup(real_axis(zero), imag_axis())


def tick_numbers():
    g = VGroup()
    for i in range(-settings.T8_XR, settings.T8_XR + 1):
        if i == 0:
            continue
        p = at((i, 0))
        g.add(txt(f"{i}", p[0], p[1] - settings.T8A_NUM_DY, settings.T8_LBL_SCALE, MUTED))
    return g


def zdot(z, colour=BLUE_C):
    return Dot(at(z), color=colour, radius=settings.T8_DOT_R)


def zarrow(z, colour=BLUE_C):
    return Arrow(at((0, 0)), at(z), color=colour, buff=0, stroke_width=settings.STROKE_GRID + 1)


def zlabel(z, value, colour=BLUE_C, dx=0.35, dy=0.3):
    return txt(value, at(z)[0] + dx, at(z)[1] + dy, settings.EQ_SCALE, colour)


def as_text(z):
    a, b = z
    sign = "+" if b >= 0 else "-"
    return f"{a:g} {sign} {abs(b):g}i"


def mul(u, v):
    return (u[0] * v[0] - u[1] * v[1], u[0] * v[1] + u[1] * v[0])


def add(u, v):
    return (u[0] + v[0], u[1] + v[1])


def arg_of(z):
    return float(np.arctan2(z[1], z[0]))


def mod_of(z):
    return float(np.hypot(z[0], z[1]))


def angle_arc(z, radius, colour=GOLD_C):
    return Arc(radius=radius * UNIT, start_angle=0, angle=arg_of(z), arc_center=at((0, 0)),
               color=colour, stroke_width=settings.STROKE_GRID + 1)


class PointOnPlane(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("the ordinary numbers all sit on one line")
        line_ax = real_axis()
        nums = tick_numbers()
        self.play(FadeIn(cap), Create(line_ax), FadeIn(nums))
        self.wait(0.4)

        try_v = settings.T8A_TRY
        work = []
        for sign in (1, -1):
            start = (sign * try_v, 0)
            landing = (try_v * try_v, 0)
            dot = zdot(start, BLUE_C)
            tag = txt(f"{sign * try_v:g}", at(start)[0], at(start)[1] + settings.T8A_LBL_DY,
                      settings.EQ_SCALE, BLUE_C)
            self.play(FadeIn(dot), FadeIn(tag), run_time=settings.FAST)
            body = f"{sign * try_v:g} × {sign * try_v:g} = {try_v * try_v:g}"
            row = txt(body, settings.T8A_WORK_X,
                      settings.T8A_WORK_Y - len(work) * settings.T8A_WORK_DY,
                      settings.EQ_SCALE, GREEN_C)
            work.append(row)
            self.play(dot.animate.move_to(at(landing)),
                      Transform(tag, txt(f"{try_v * try_v:g}", at(landing)[0],
                                         at(landing)[1] + settings.T8A_LBL_DY,
                                         settings.EQ_SCALE, GREEN_C)),
                      FadeIn(row), run_time=settings.MID)
            self.wait(0.3)
            self.play(FadeOut(dot), FadeOut(tag), run_time=settings.FAST)
        sofar = txt("every square lands on the right", settings.T8A_WORK_X,
                    settings.T8A_WORK_Y - 2 * settings.T8A_WORK_DY, settings.EQ_SCALE, MUTED)
        self.play(FadeIn(sofar))
        self.wait(0.4)

        self.play(Transform(cap, caption("so no number on this line squares to minus one")))
        gap = zdot((-1, 0), CORAL_C)
        gap_lbl = txt("-1", at((-1, 0))[0], at((-1, 0))[1] + settings.T8A_LBL_DY,
                      settings.EQ_SCALE, CORAL_C)
        miss = txt("nothing here squares to -1", settings.T8A_WORK_X,
                   settings.T8A_WORK_Y - 3 * settings.T8A_WORK_DY, settings.EQ_SCALE, CORAL_C)
        self.play(FadeIn(gap), FadeIn(gap_lbl))
        self.play(FadeIn(miss), Indicate(gap, color=CORAL_C))
        self.wait(0.6)

        self.play(Transform(cap, caption("invent one, and it needs a direction of its own")))
        made = txt("i × i = -1", settings.T8A_WORK_X,
                   settings.T8A_WORK_Y - 4 * settings.T8A_WORK_DY, settings.FORMULA_SCALE,
                   GOLD_C)
        self.play(FadeIn(made))
        self.wait(0.4)
        up = imag_axis()
        i_dot = zdot((0, 1), GOLD_C)
        i_lbl = txt("i", at((0, 1))[0] - 0.3, at((0, 1))[1], settings.EQ_SCALE, GOLD_C)
        self.play(Create(up), run_time=settings.MID)
        self.play(FadeIn(i_dot), FadeIn(i_lbl))
        self.wait(0.5)
        self.play(FadeOut(VGroup(*work, sofar, miss, made, gap, gap_lbl, nums,
                                  i_dot, i_lbl)))

        self.play(Transform(cap, caption("a real part along the line, an imaginary part up")))
        z = settings.T8_Z1
        dot = zdot(z)
        self.play(FadeIn(dot))
        drop_x = DashedLine(at(z), at((z[0], 0)), color=MUTED, stroke_width=1)
        drop_y = DashedLine(at(z), at((0, z[1])), color=MUTED, stroke_width=1)
        re_lbl = txt(f"{z[0]:g}", at((z[0], 0))[0], at((0, 0))[1] - 0.35, settings.EQ_SCALE, GOLD_C)
        im_lbl = txt(f"{z[1]:g}i", at((0, 0))[0] - 0.45, at((0, z[1]))[1], settings.EQ_SCALE,
                     GOLD_C)
        self.play(Create(drop_x), FadeIn(re_lbl))
        self.play(Create(drop_y), FadeIn(im_lbl))
        read = txt(as_text(z), settings.T8_READ_X, settings.T8_READ_Y, settings.FORMULA_SCALE,
                   BLUE_C)
        self.play(TransformFromCopy(VGroup(re_lbl, im_lbl), read))
        naming = txt("one number, two coordinates", settings.T8_READ_X,
                     settings.T8_READ_Y - settings.T8_READ_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(naming))
        self.wait(0.5)

        extras = VGroup(*[zdot(w, MUTED) for w in settings.T8_EXTRA])
        tags = VGroup(*[zlabel(w, as_text(w), MUTED) for w in settings.T8_EXTRA])
        self.play(LaggedStart(*[FadeIn(VGroup(d, t)) for d, t in zip(extras, tags)],
                              lag_ratio=0.3), run_time=settings.MID)
        note = common.top_note("every point on the plane is one of these numbers")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class AddAsShift(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("adding shifts the point")
        grid = plane()
        self.play(FadeIn(cap), Create(grid))

        for k, (u, v) in enumerate(((settings.T8_ADD_A, settings.T8_ADD_B),
                                    (settings.T8_ADD_C, settings.T8_ADD_D))):
            a_dot, b_dot = zdot(u, BLUE_C), zdot(v, GOLD_C)
            a_arr, b_arr = zarrow(u, BLUE_C), zarrow(v, GOLD_C)
            a_lbl = zlabel(u, as_text(u), BLUE_C)
            b_lbl = zlabel(v, as_text(v), GOLD_C)
            self.play(FadeIn(a_dot), Create(a_arr), FadeIn(a_lbl), run_time=settings.FAST)
            self.play(FadeIn(b_dot), Create(b_arr), FadeIn(b_lbl), run_time=settings.FAST)
            s = add(u, v)
            laid = Arrow(at(u), at(s), color=GOLD_C, buff=0,
                         stroke_width=settings.STROKE_GRID + 1)
            ghost = b_arr.copy()
            self.add(ghost)
            self.play(Transform(ghost, laid), run_time=settings.MID)
            s_dot = zdot(s, GREEN_C)
            s_arr = zarrow(s, GREEN_C)
            s_lbl = zlabel(s, as_text(s), GREEN_C)
            self.play(FadeIn(s_dot), Create(s_arr), FadeIn(s_lbl),
                      run_time=settings.MID if k == 0 else settings.FAST)
            self.wait(0.6)
            if k == 0:
                self.play(Transform(cap, caption("the same shift, from a different start")))
            if k == 0:
                self.play(FadeOut(VGroup(a_dot, b_dot, a_arr, b_arr, ghost, a_lbl, b_lbl,
                                         s_dot, s_arr, s_lbl)), run_time=settings.FAST)

        rule = txt("the second arrow, laid at the tip of the first", 0, settings.T8_RULE_Y,
                   settings.EQ_SCALE, MUTED)
        self.play(FadeIn(rule))
        note = common.top_note("addition moves a point without turning it")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class MulAsTurn(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        u = settings.T8_MUL_A
        v = settings.T8_MUL_B
        w = mul(u, v)
        a, b = u
        c, d = v

        cap = caption("multiplying two of these numbers")
        grid = plane()
        self.play(FadeIn(cap), Create(grid))

        a_arr, b_arr = zarrow(u, BLUE_C), zarrow(v, GOLD_C)
        a_dot, b_dot = zdot(u, BLUE_C), zdot(v, GOLD_C)
        a_lbl = zlabel(u, as_text(u), BLUE_C, dx=-3.1, dy=-1.49)
        b_lbl = zlabel(v, as_text(v), GOLD_C, dx=-1.05, dy=0.45)
        self.play(FadeIn(a_dot), Create(a_arr), FadeIn(a_lbl))
        self.play(FadeIn(b_dot), Create(b_arr), FadeIn(b_lbl))
        self.wait(0.3)

        rows = [
            (f"({a:g} + {b:g}i) × ({c:g} + {d:g}i)", common.INK),
            (f"= {a:g}·{c:g} + {a:g}·{d:g}i + {b:g}i·{c:g} + {b:g}·{d:g}·i·i", MUTED),
            ("i · i = -1, so the last piece turns negative", GOLD_C),
            (f"= ({a:g}·{c:g} - {b:g}·{d:g}) + ({a:g}·{d:g} + {b:g}·{c:g})i", MUTED),
            (f"= {w[0]:g} + {w[1]:g}i", GREEN_C),
        ]
        block = VGroup()
        for i, (body, colour) in enumerate(rows):
            row = txt(body, settings.T8B_EQ_X, settings.T8B_EQ_Y - i * settings.T8B_EQ_DY,
                      settings.T8B_EQ_SCALE, colour)
            block.add(row)
            self.play(FadeIn(row), run_time=settings.FAST)
            self.wait(0.25)
        self.wait(0.4)

        w_dot = zdot(w, GREEN_C)
        w_lbl = zlabel(w, as_text(w), GREEN_C, dx=-2.9, dy=0.35)
        self.play(TransformFromCopy(block[4], w_lbl), FadeIn(w_dot), run_time=settings.MID)
        gen = txt("(a + bi)(c + di) = (ac - bd) + (ad + bc)i", settings.T8B_EQ_X,
                  settings.T8B_EQ_Y - 5 * settings.T8B_EQ_DY - 0.2,
                  settings.T8B_EQ_SCALE, BLUE_C)
        self.play(FadeIn(gen))
        self.wait(0.7)

        self.play(Transform(cap, caption("the same answer, read as a turn and a stretch")),
                  FadeOut(block), FadeOut(gen))
        arc_a = angle_arc(u, settings.T8_ARC_R, BLUE_C)
        arc_b = angle_arc(v, settings.T8_ARC_R2, GOLD_C)
        self.play(Create(arc_a), Create(arc_b))
        lens = txt(f"lengths  {mod_of(u):.2f} × {mod_of(v):.2f} = {mod_of(u) * mod_of(v):.2f}",
                   settings.T8B_GEO_X, settings.T8B_GEO_Y, settings.T8B_GEO_SCALE, GOLD_C)
        angs = txt(f"angles  {np.degrees(arg_of(u)):.1f} + {np.degrees(arg_of(v)):.1f}"
                   f" = {np.degrees(arg_of(u)) + np.degrees(arg_of(v)):.1f} degrees",
                   settings.T8B_GEO_X, settings.T8B_GEO_Y - settings.T8B_GEO_DY,
                   settings.T8B_GEO_SCALE, GREEN_C)
        self.play(FadeIn(lens))
        self.play(FadeIn(angs))
        self.wait(0.4)

        w_arr = zarrow(w, GREEN_C)
        moving = a_arr.copy()
        self.add(moving)
        self.play(Transform(moving, w_arr), run_time=settings.SLOW)
        arc_w = angle_arc(w, settings.T8B_ARC_R3, GREEN_C)
        self.play(Create(arc_w))
        check = VGroup(
            txt(f"the answer is {mod_of(w):.2f} long", settings.T8B_GEO_X,
                settings.T8B_GEO_Y - 2 * settings.T8B_GEO_DY, settings.T8B_GEO_SCALE,
                common.INK),
            txt(f"at {np.degrees(arg_of(w)):.1f} degrees", settings.T8B_GEO_X,
                settings.T8B_GEO_Y - 3 * settings.T8B_GEO_DY, settings.T8B_GEO_SCALE,
                common.INK))
        self.play(FadeIn(check), Indicate(VGroup(arc_a, arc_b, arc_w), color=GREEN_C))
        rule = txt("angles add, lengths multiply", 0, settings.T8_RULE_Y, settings.EQ_SCALE, MUTED)
        self.play(FadeIn(rule))
        self.wait(0.6)

        self.play(FadeOut(VGroup(a_arr, b_arr, moving, a_dot, b_dot, w_dot,
                                 a_lbl, b_lbl, w_lbl, arc_a, arc_b, arc_w)),
                  FadeOut(lens), FadeOut(angs), FadeOut(check), FadeOut(rule),
                  Transform(cap, caption("multiplying by i is a quarter turn")))
        one = zarrow((1, 0), BLUE_C)
        one_lbl = zlabel((1, 0), "1", BLUE_C)
        self.play(Create(one), FadeIn(one_lbl))
        turned = zarrow((0, 1), GREEN_C)
        turned_lbl = zlabel((0, 1), "i", GREEN_C)
        quarter = Arc(radius=settings.T8_ARC_R * UNIT, start_angle=0, angle=90 * DEGREES,
                      arc_center=at((0, 0)), color=GOLD_C, stroke_width=settings.STROKE_GRID + 1)
        spun = one.copy()
        self.add(spun)
        self.play(Transform(spun, turned), Create(quarter), run_time=settings.SLOW)
        self.play(FadeIn(turned_lbl))
        step1 = txt("1 × i = i", settings.T8B_GEO_X, settings.T8B_GEO_Y,
                    settings.T8B_GEO_SCALE, GREEN_C)
        self.play(FadeIn(step1))
        minus = zarrow((-1, 0), CORAL_C)
        minus_lbl = zlabel((-1, 0), "-1", CORAL_C, dx=-0.4)
        again = spun.copy()
        self.add(again)
        half = Arc(radius=settings.T8_ARC_R2 * UNIT, start_angle=90 * DEGREES,
                   angle=90 * DEGREES, arc_center=at((0, 0)), color=GOLD_C,
                   stroke_width=settings.STROKE_GRID + 1)
        self.play(Transform(again, minus), Create(half), run_time=settings.MID)
        step2 = txt("i × i = -1", settings.T8B_GEO_X,
                    settings.T8B_GEO_Y - settings.T8B_GEO_DY, settings.T8B_GEO_SCALE, CORAL_C)
        self.play(FadeIn(minus_lbl), FadeIn(step2))
        note = common.top_note("two quarter turns land on minus one")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class ModAndArg(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("a distance and an angle")
        grid = plane()
        self.play(FadeIn(cap), Create(grid))

        turn = ValueTracker(settings.T8_DRAG_PATH[0][0])
        reach = ValueTracker(settings.T8_DRAG_PATH[0][1])

        def point():
            a = turn.get_value()
            r = reach.get_value()
            return (r * np.cos(a), r * np.sin(a))

        arrow = always_redraw(lambda: zarrow(point(), BLUE_C))
        dot = always_redraw(lambda: zdot(point(), BLUE_C))
        arc = always_redraw(lambda: angle_arc(point(), settings.T8_ARC_R, GOLD_C))
        mod_read = always_redraw(lambda: txt(
            f"distance {mod_of(point()):.2f}", settings.T8_READ_X, settings.T8_READ_Y,
            settings.EQ_SCALE, GOLD_C))
        arg_read = always_redraw(lambda: txt(
            f"angle {np.degrees(arg_of(point())) % 360:.0f} degrees", settings.T8_READ_X,
            settings.T8_READ_Y - settings.T8_READ_DY, settings.EQ_SCALE, GOLD_C))
        self.play(FadeIn(arrow), FadeIn(dot), FadeIn(arc))
        self.play(FadeIn(mod_read), FadeIn(arg_read))
        names = txt("the distance is the modulus, the angle is the argument", 0,
                    settings.T8_RULE_Y, settings.EQ_SCALE, MUTED)
        self.play(FadeIn(names))
        self.wait(0.5)
        for a, r in settings.T8_DRAG_PATH[1:]:
            self.play(turn.animate.set_value(a), reach.animate.set_value(r),
                      run_time=settings.SLOW)
            self.wait(0.4)
        note = common.top_note("two numbers describe the point just as well")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class SquareTheAngle(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("squaring doubles the angle")
        grid = plane()
        unit_circle = Circle(radius=UNIT, arc_center=at((0, 0)), color=MUTED,
                             stroke_width=settings.STROKE_GRID)
        self.play(FadeIn(cap), Create(grid), Create(unit_circle))

        a = settings.T8_SQ_ANGLE * DEGREES
        z = (np.cos(a), np.sin(a))
        z2 = mul(z, z)
        arr = zarrow(z, BLUE_C)
        dot = zdot(z, BLUE_C)
        arc = angle_arc(z, settings.T8_ARC_R, GOLD_C)
        lbl = txt(f"{settings.T8_SQ_ANGLE} degrees", at(z)[0] + 0.7, at(z)[1] + 0.3,
                  settings.NAME_SCALE, GOLD_C)
        self.play(FadeIn(dot), Create(arr), Create(arc), FadeIn(lbl))
        self.wait(0.3)
        arr2 = zarrow(z2, GREEN_C)
        dot2 = zdot(z2, GREEN_C)
        arc2 = angle_arc(z2, settings.T8_ARC_R2, GREEN_C)
        lbl2 = txt(f"{2 * settings.T8_SQ_ANGLE} degrees", at(z2)[0] + 0.8, at(z2)[1] + 0.3,
                   settings.NAME_SCALE, GREEN_C)
        lifted = arr.copy()
        self.add(lifted)
        self.play(Transform(lifted, arr2), run_time=settings.SLOW)
        self.play(FadeIn(dot2), Create(arc2), FadeIn(lbl2))
        self.wait(0.5)
        self.play(FadeOut(VGroup(arr, lifted, dot, dot2, arc, arc2, lbl, lbl2)),
                  Transform(cap, caption("just outside runs away, just inside falls in")))
        for start, colour, tag in ((settings.T8_SQ_OUT, CORAL_C, "just outside"),
                                   (settings.T8_SQ_IN, GREEN_C, "just inside")):
            walk = []
            z = (start * np.cos(a), start * np.sin(a))
            walk.append(z)
            for _ in range(settings.T8_SQ_STEPS):
                z = mul(z, z)
                if mod_of(z) > settings.T8_XR:
                    break
                walk.append(z)
            dots = VGroup(*[zdot(w, colour) for w in walk])
            path = poly([at(w) for w in walk], colour, 1)
            lbl = txt(tag, settings.T8_READ_X,
                      settings.T8_READ_Y if colour is CORAL_C
                      else settings.T8_READ_Y - settings.T8_READ_DY,
                      settings.EQ_SCALE, colour)
            self.play(FadeIn(lbl), run_time=settings.FAST)
            self.play(LaggedStart(*[FadeIn(d) for d in dots], lag_ratio=0.4),
                      Create(path), run_time=settings.SLOW)
            self.wait(0.4)
        note = common.top_note("this one operation drives everything that follows")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def set_image(c, extent, box, inside):
    z = topic09.cgrid(extent, settings.T9_PX)
    counts = topic09.escape_counts(z, complex(c[0], c[1]), settings.T9_ITERS,
                                   settings.T9_RADIUS)
    return common.image_at(topic09.paint_escape(counts, settings.T9_ITERS, inside), box)


def hot_spot(c, extent, iters, min_x):
    z = topic09.cgrid(extent, settings.T9_PX)
    counts = topic09.escape_counts(z, complex(c[0], c[1]), iters, settings.T9_RADIUS)
    x0, x1, y0, y1 = extent
    h, w = counts.shape
    xs = np.linspace(x0, x1, w)
    counts = np.where(xs[None, :] > min_x, counts, -1)
    idx = np.unravel_index(int(np.argmax(counts)), counts.shape)
    return (x0 + (x1 - x0) * idx[1] / (w - 1), y1 - (y1 - y0) * idx[0] / (h - 1))


def square_walk(start, kill, steps):
    z = start
    out = [z]
    for _ in range(steps):
        z = mul(z, z)
        out.append(z)
        if mod_of(z) > kill:
            break
    return out


class WhySquarePlusC(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("squaring on its own has only three outcomes")
        grid = plane(zero=False)
        ring = Circle(radius=UNIT, arc_center=at((0, 0)), color=MUTED,
                      stroke_width=settings.STROKE_GRID)
        self.play(FadeIn(cap), Create(grid), Create(ring))
        ring_lbl = txt("distance 1", at((0, 0))[0] - 1.5, at((0, 0))[1] + 1.5,
                       settings.NAME_SCALE, MUTED)
        self.play(FadeIn(ring_lbl))
        self.wait(0.3)

        angle = settings.T8F_ANGLE * DEGREES
        cases = ((settings.T8F_IN, GREEN_C, "starts inside: falls to 0"),
                 (1.0, GOLD_C, "starts on the circle: stays"),
                 (settings.T8F_OUT, CORAL_C, "starts outside: runs away"))
        shown = VGroup()
        for k, (r, colour, tag) in enumerate(cases):
            walk = square_walk((r * np.cos(angle), r * np.sin(angle)), settings.T8F_KILL,
                               settings.T8F_SQ_STEPS)
            dots = VGroup(*[Dot(at(p), color=colour, radius=settings.T8F_DOT_R) for p in walk])
            path = poly([at(p) for p in walk], colour, 1)
            row = txt(tag, settings.T8F_ROW_X, settings.T8F_ROW_Y - k * settings.T8F_ROW_DY,
                      settings.T8F_ROW_SCALE, colour)
            self.play(FadeIn(row), run_time=settings.FAST)
            self.play(LaggedStart(*[FadeIn(d) for d in dots], lag_ratio=0.35), Create(path),
                      run_time=settings.MID)
            shown.add(dots, path, row)
            self.wait(0.3)
        edge = txt("the edge between the two", settings.T8F_ROW_X,
                   settings.T8F_ROW_Y - 2.8 * settings.T8F_ROW_DY, settings.T8F_ROW_SCALE, MUTED)
        edge2 = txt("and it is exactly this circle", settings.T8F_ROW_X,
                    settings.T8F_ROW_Y - 3.6 * settings.T8F_ROW_DY, settings.T8F_ROW_SCALE,
                    MUTED)
        self.play(FadeIn(edge), Indicate(ring, color=BLUE_C))
        self.play(FadeIn(edge2))
        self.wait(0.7)
        self.play(FadeOut(shown), FadeOut(edge), FadeOut(edge2), FadeOut(ring_lbl))

        self.play(Transform(cap, caption("so add one fixed number after every squaring")))
        rule = txt("z becomes z × z + c", 0, settings.T8F_RULE_Y,
                   settings.FORMULA_SCALE, common.INK,
                   [(0, 1, BLUE_C), (8, 9, BLUE_C), (10, 11, BLUE_C), (12, 13, GOLD_C)])
        self.play(FadeIn(rule))
        c = settings.T8F_C
        c_dot = zdot(c, GOLD_C)
        c_lbl = txt(f"c = {as_text(c)}", at(c)[0] - 1.5, at(c)[1] + 0.4, settings.EQ_SCALE,
                    GOLD_C)
        self.play(FadeIn(c_dot), FadeIn(c_lbl))
        z = settings.T8F_Z0
        here = zdot(z, BLUE_C)
        here_lbl = txt(f"z = {as_text(z)}", settings.T8F_ROW_X, settings.T8F_ROW_Y,
                       settings.T8F_ROW_SCALE, BLUE_C)
        self.play(FadeIn(here), FadeIn(here_lbl))
        self.wait(0.4)

        for step in range(settings.T8F_SHOW):
            sq = mul(z, z)
            arm = zarrow(z, BLUE_C)
            self.play(Create(arm), run_time=settings.FAST)
            move_a = txt("square: double the angle", settings.T8F_ROW_X,
                         settings.T8F_ROW_Y - settings.T8F_ROW_DY, settings.T8F_ROW_SCALE,
                         GREEN_C)
            nums_a = VGroup(
                txt(f"{mod_of(z):.2f} → {mod_of(sq):.2f} long", settings.T8F_ROW_X,
                    settings.T8F_ROW_Y - 2 * settings.T8F_ROW_DY, settings.T8F_ROW_SCALE,
                    MUTED),
                txt(f"{np.degrees(arg_of(z)) % 360:.0f} → "
                    f"{np.degrees(arg_of(sq)) % 360:.0f} degrees", settings.T8F_ROW_X,
                    settings.T8F_ROW_Y - 3 * settings.T8F_ROW_DY, settings.T8F_ROW_SCALE,
                    MUTED))
            landed = zarrow(sq, GREEN_C)
            moving = arm.copy()
            self.add(moving)
            self.play(FadeIn(move_a), Transform(moving, landed), run_time=settings.MID)
            self.play(FadeIn(nums_a), run_time=settings.FAST)
            mid_dot = zdot(sq, GREEN_C)
            self.play(FadeIn(mid_dot), run_time=settings.FAST)

            nxt = add(sq, c)
            move_b = txt("shift: slide by c", settings.T8F_ROW_X,
                         settings.T8F_ROW_Y - 4 * settings.T8F_ROW_DY,
                         settings.T8F_ROW_SCALE, GOLD_C)
            slide = Arrow(at(sq), at(nxt), color=GOLD_C, buff=0,
                          stroke_width=settings.STROKE_GRID + 1)
            new_dot = zdot(nxt, BLUE_C)
            self.play(FadeIn(move_b), Create(slide), run_time=settings.MID)
            self.play(FadeIn(new_dot),
                      Transform(here_lbl, txt(f"z = {as_text((round(nxt[0], 2), round(nxt[1], 2)))}",
                                              settings.T8F_ROW_X, settings.T8F_ROW_Y,
                                              settings.T8F_ROW_SCALE, BLUE_C)),
                      run_time=settings.FAST)
            self.wait(0.4)
            self.play(FadeOut(VGroup(arm, moving, landed, mid_dot, slide, move_a, move_b,
                                     nums_a, here)), run_time=settings.FAST)
            here = new_dot
            z = nxt

        self.play(Transform(cap, caption("keep going and the point wanders without escaping")))
        walk = [z]
        for _ in range(settings.T8F_ORBIT):
            z = add(mul(z, z), c)
            walk.append(z)
        trail = poly([at(p) for p in walk], BLUE_C, 1)
        marks = VGroup(*[Dot(at(p), color=BLUE_C, radius=settings.T8F_DOT_R) for p in walk])
        self.play(Create(trail), LaggedStart(*[FadeIn(d) for d in marks], lag_ratio=0.3),
                  run_time=settings.SLOW)
        self.wait(0.5)
        self.play(FadeOut(VGroup(trail, marks, here, here_lbl)))

        self.play(Transform(cap, caption("the same test on every starting point at once")))
        extent = (-settings.T8_XR, settings.T8_XR, -settings.T8_YR, settings.T8_YR)
        box = (at((-settings.T8_XR, 0))[0], at((settings.T8_XR, 0))[0],
               at((0, -settings.T8_YR))[1], at((0, settings.T8_YR))[1])
        img = set_image(c, extent, box, settings.ACCENT_STRUCTURE)
        self.add(img)
        self.bring_to_back(img)
        self.play(FadeIn(img), FadeOut(ring), run_time=settings.MID)
        stay = txt("the points that never escape", settings.T8F_ROW_X, settings.T8F_ROW_Y,
                   settings.T8F_ROW_SCALE, BLUE_C)
        self.play(FadeIn(stay))
        self.wait(0.4)

        spot = hot_spot(c, extent, settings.T9_ITERS, settings.T8F_SPOT_MIN_X)
        half = settings.T8F_ZOOM_HALF
        zbox = (settings.T8F_INSET_X - settings.T8F_INSET_SIZE / 2,
                settings.T8F_INSET_X + settings.T8F_INSET_SIZE / 2,
                settings.T8F_INSET_Y - settings.T8F_INSET_SIZE / 2,
                settings.T8F_INSET_Y + settings.T8F_INSET_SIZE / 2)
        zext = (spot[0] - half, spot[0] + half, spot[1] - half, spot[1] + half)
        src = Rectangle(width=2 * half * UNIT, height=2 * half * UNIT, color=GOLD_C,
                        stroke_width=settings.STROKE_GRID).move_to(at(spot))
        dst = Rectangle(width=settings.T8F_INSET_SIZE, height=settings.T8F_INSET_SIZE,
                        color=GOLD_C, stroke_width=settings.STROKE_GRID)
        dst.move_to([settings.T8F_INSET_X, settings.T8F_INSET_Y, 0])
        close = topic09.flat_set_image(zext, zbox)
        self.play(FadeOut(stay), Create(src))
        self.play(Create(dst), FadeIn(close), run_time=settings.MID)
        said = txt("the edge is no longer a circle", settings.T8F_INSET_X,
                   settings.T8F_INSET_Y - settings.T8F_INSET_SIZE / 2 - 0.45,
                   settings.T8F_ROW_SCALE, CORAL_C)
        self.play(FadeIn(said))
        self.wait(0.7)

        self.play(Transform(cap, caption("both moves were already built in this topic")),
                  FadeOut(said), FadeOut(close), FadeOut(dst), FadeOut(src), FadeOut(img))
        parts = VGroup(
            txt("z × z   turns and stretches", settings.T8F_ROW_X, settings.T8F_ROW_Y,
                settings.T8F_ROW_SCALE, GREEN_C),
            txt("+ c   slides by a fixed step", settings.T8F_ROW_X,
                settings.T8F_ROW_Y - settings.T8F_ROW_DY, settings.T8F_ROW_SCALE, GOLD_C),
            txt("nothing else is added", settings.T8F_ROW_X,
                settings.T8F_ROW_Y - 2 * settings.T8F_ROW_DY, settings.T8F_ROW_SCALE, MUTED))
        for one in parts:
            self.play(FadeIn(one), run_time=settings.FAST)
        note = common.top_note("the simplest rule that is not a straight line")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)
