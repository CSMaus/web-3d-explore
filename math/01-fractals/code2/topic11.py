import numpy as np
from manim import (
    Scene, Circle, Dot, Line, Rectangle, Square, VGroup,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, Transform, TransformFromCopy,
    DOWN, UP,
)

import settings
import common
import growth
import topic04
import topic06
import topic07
import topic09
from common import BLUE_C, GOLD_C, GREEN_C, CORAL_C, INK, MUTED, caption, poly, txt


def koch_cloud(level, dense):
    pts = topic04.koch_span(1.0, 0.0, level)
    return np.array(common.dense_pts(pts, dense))[:, :2]


def box_counts(cloud, sizes):
    return [len(np.unique(np.floor(cloud / s).astype(np.int64), axis=0)) for s in sizes]


class OptionalStrand(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        title = txt("an optional deeper layer", 0, settings.T11_TITLE_Y,
                    settings.FORMULA_SCALE, INK)
        sub = txt("the theory and the proofs behind the pictures", 0, settings.T11_SUB_Y,
                  settings.EQ_SCALE, MUTED)
        note = txt("the main arc is complete without it, and nothing here assumes it", 0,
                   settings.T11_NOTE_Y, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(title))
        self.play(FadeIn(sub))
        self.play(FadeIn(note))
        self.wait(1.5)


class DeriveDimension(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("solve the counting law for the exponent")
        koch = poly(topic04.koch_span(1.0, 0.0, 4), BLUE_C, settings.STROKE_GRID)
        common.fit_box(koch, settings.T11_SH_H * 2, settings.T11_SH_H,
                       (-settings.T11_SH_DX, settings.T11_SH_Y))
        sier = topic06.sier_tri(4, (0.0, 0.0), 2.0)
        common.fit_box(sier, settings.T11_SH_H, settings.T11_SH_H,
                       (settings.T11_SH_DX, settings.T11_SH_Y))
        k_lbl = txt("4 copies at 1/3", -settings.T11_SH_DX,
                    settings.T11_SH_Y - settings.T11_SH_H / 2 - 0.4, settings.NAME_SCALE, MUTED,
                    [(0, 1, BLUE_C), (9, 12, GOLD_C)])
        s_lbl = txt("3 copies at 1/2", settings.T11_SH_DX,
                    settings.T11_SH_Y - settings.T11_SH_H / 2 - 0.4, settings.NAME_SCALE, MUTED,
                    [(0, 1, BLUE_C), (9, 12, GOLD_C)])
        self.play(FadeIn(cap), FadeIn(koch), FadeIn(sier))
        self.play(FadeIn(k_lbl), FadeIn(s_lbl))
        self.wait(0.5)

        line1 = txt("count = (1/scale)ᵈ", 0, settings.T11_CHAIN_Y, settings.FORMULA_SCALE, INK,
                    [(0, 5, BLUE_C), (7, 14, GOLD_C), (15, 16, GREEN_C)])
        self.play(FadeIn(line1))
        self.wait(0.4)
        line2 = txt("N = sᵈ", 0, settings.T11_CHAIN_Y, settings.FORMULA_SCALE, INK,
                    [(0, 1, BLUE_C), (2, 3, GOLD_C), (3, 4, GREEN_C)])
        self.play(Transform(line1, line2))
        self.wait(0.4)
        line3 = txt("log N = d × log s", 0, settings.T11_CHAIN_Y - settings.T11_CHAIN_DY,
                    settings.FORMULA_SCALE, INK,
                    [(3, 4, BLUE_C), (5, 6, GREEN_C), (10, 11, GOLD_C)])
        step3 = txt("take the logarithm of both sides", settings.T11_STEP_X,
                    settings.T11_CHAIN_Y - settings.T11_CHAIN_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(step3))
        self.play(TransformFromCopy(line1, line3))
        self.wait(0.4)
        line4 = txt("d = log N / log s", 0, settings.T11_CHAIN_Y - 2.1 * settings.T11_CHAIN_DY,
                    settings.FORMULA_SCALE, INK,
                    [(0, 1, GREEN_C), (5, 6, BLUE_C), (10, 11, GOLD_C)])
        step4 = txt("divide by the logarithm of the scale", settings.T11_STEP_X,
                    settings.T11_CHAIN_Y - 2.1 * settings.T11_CHAIN_DY, settings.NAME_SCALE,
                    MUTED)
        self.play(FadeIn(step4))
        self.play(TransformFromCopy(line3, line4))
        self.wait(0.5)

        k_res, k_val = common.dim_text(4, 3, -settings.T11_SH_DX, settings.T11_RES_Y,
                                       settings.EQ_SCALE)
        s_res, s_val = common.dim_text(3, 2, settings.T11_SH_DX, settings.T11_RES_Y,
                                       settings.EQ_SCALE)
        self.play(TransformFromCopy(line4, k_res))
        self.play(TransformFromCopy(line4, s_res))
        note = common.top_note("the formula is earned, not handed over")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class BoxLimit(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("finer boxes, and the slope settles")
        curve = poly(topic04.koch_span(1.0, 0.0, 5), BLUE_C, settings.STROKE_GRID)
        common.fit_box(curve, settings.T11_CURVE_H * 3, settings.T11_CURVE_H,
                       (0.0, settings.T11_CURVE_Y))
        self.play(FadeIn(cap), FadeIn(curve))

        cloud = koch_cloud(settings.T11_KOCH_LEVEL, settings.T11_DENSE)
        exact = float(np.log(4) / np.log(3))
        rows = []
        fits = []
        for i, (lo, hi) in enumerate(settings.T11_RANGES):
            sizes = [1 / 3 ** k for k in range(lo, hi)]
            counts = box_counts(cloud, sizes)
            slope = -np.polyfit(np.log(sizes), np.log(counts), 1)[0]
            fits.append((sizes, counts, float(slope)))
            row = txt(f"boxes 1/3^{lo} to 1/3^{hi - 1}   slope {slope:.4f}", settings.T11_TAB_X,
                      settings.T11_TAB_Y - i * settings.T11_TAB_DY, settings.EQ_SCALE, MUTED,
                      [(0, 14, GOLD_C), (19, 40, GREEN_C)])
            rows.append(row)

        plot = common.LogLog(settings.T11_PLOT_X, settings.T11_PLOT_Y,
                             xlabel="box size", ylabel="boxes hit")
        sizes_all = [1 / 3 ** k for k in range(settings.T11_RANGES[0][0],
                                               settings.T11_RANGES[-1][1])]
        counts_all = box_counts(cloud, sizes_all)
        slope_all, inter_all = plot.fit(sizes_all, counts_all)
        self.play(Create(plot.build()))
        dots = plot.dots(sizes_all, counts_all, GOLD_C)
        self.play(LaggedStart(*[FadeIn(d) for d in dots], lag_ratio=0.2), run_time=settings.MID)
        line = plot.fit_line(sizes_all, slope_all, inter_all, GREEN_C)
        self.play(Create(line))
        for row in rows:
            self.play(FadeIn(row), run_time=settings.FAST)
        self.wait(0.5)
        target = txt(f"log 4 / log 3 = {exact:.4f}", settings.T11_TAB_X,
                     settings.T11_TAB_Y - len(rows) * settings.T11_TAB_DY - 0.2,
                     settings.EQ_SCALE, INK,
                     [(4, 5, BLUE_C), (9, 10, GOLD_C), (11, 30, GREEN_C)])
        self.play(FadeIn(target), Indicate(VGroup(*rows), color=GREEN_C))
        note = common.top_note("the counting slope closes in on the exact value")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class HausdorffPower(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("add up the piece sizes raised to a power")
        level = settings.T11_HD_LEVEL
        pts = topic04.koch_span(1.0, 0.0, level)
        side = 1 / 3 ** level
        curve = poly(pts, BLUE_C, settings.STROKE_GRID)
        group = VGroup(curve)
        for i in range(4 ** level):
            a, b = pts[i], pts[i + 1]
            cell = Square(side_length=side, color=GOLD_C, stroke_width=1)
            cell.set_fill(GOLD_C, opacity=settings.T11_HD_FILL)
            cell.move_to((a + b) / 2)
            group.add(cell)
        common.fit_box(group, settings.T11_HD_H * 3, settings.T11_HD_H,
                       (settings.T11_HD_X, settings.T11_HD_Y))
        self.play(FadeIn(cap), FadeIn(group))
        rel = txt("sum of (piece size)ᵖ", settings.T11_HD_X,
                  settings.T11_HD_Y - settings.T11_HD_H / 2 - 0.6, settings.EQ_SCALE, INK,
                  [(6, 15, GOLD_C), (16, 17, CORAL_C)])
        count = txt(f"{4 ** level} pieces of size 1/{3 ** level}", settings.T11_HD_X,
                    settings.T11_HD_Y - settings.T11_HD_H / 2 - 1.1, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(rel), FadeIn(count))
        self.wait(0.5)

        ox = settings.T11_HP_X - settings.T11_HP_W / 2
        oy = settings.T11_HP_Y
        axes = VGroup(
            Line([ox, oy, 0], [ox + settings.T11_HP_W, oy, 0], color=MUTED,
                 stroke_width=settings.STROKE_GRID),
            Line([ox, oy, 0], [ox, oy + settings.T11_HP_H, 0], color=MUTED,
                 stroke_width=settings.STROKE_GRID),
            txt("levels of the construction", settings.T11_HP_X, oy - 0.35,
                settings.AXLBL_SCALE, MUTED),
            txt("the sum", ox - 0.5, oy + settings.T11_HP_H / 2, settings.AXLBL_SCALE, MUTED),
        )
        self.play(Create(axes))
        levels = np.arange(1, settings.T11_HD_LEVELS + 1)
        curves = {}
        for p in settings.T11_POWERS:
            curves[p] = np.log([4.0 ** k * (3.0 ** -k) ** p for k in levels])
        span = max(float(np.abs(v).max()) for v in curves.values())
        exact = float(np.log(4) / np.log(3))
        xs = ox + (levels - 1) / (settings.T11_HD_LEVELS - 1) * settings.T11_HP_W
        for i, p in enumerate(settings.T11_POWERS):
            ys = (oy + settings.T11_HP_H / 2
                  + curves[p] / (2 * span) * settings.T11_HP_H * 0.92)
            colour = GREEN_C if abs(p - exact) < 0.01 else (CORAL_C if p < exact else GOLD_C)
            path = poly([[x, y, 0] for x, y in zip(xs, ys)], colour, settings.STROKE_GRID + 1)
            lbl = txt(f"p = {p}", xs[-1] + settings.T11_HP_LBL_DX, ys[-1],
                      settings.NAME_SCALE, colour)
            self.play(Create(path), FadeIn(lbl), run_time=settings.FAST)
        self.wait(0.5)
        crit = txt(f"the critical power is {exact:.4f}", settings.T11_CRIT_X,
                   settings.T11_CRIT_Y, settings.EQ_SCALE, GREEN_C)
        name = txt("that critical power is the Hausdorff dimension", settings.T11_CRIT_X,
                   settings.T11_CRIT_Y - 0.55, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(crit))
        self.play(FadeIn(name))
        note = common.top_note("below it the sum blows up, above it the sum dies")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class LaplaceRule(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        rows, cols = settings.T11_LAP_ROWS, settings.T11_LAP_COLS
        box, pitch = topic07.grid_box(rows, cols, settings.T11_LAP_H,
                                      (settings.T11_LAP_X, settings.T11_LAP_Y))
        cluster, order, phi = growth.dbm(rows, cols, 1.0, settings.T7_SEED)

        cap = caption("the field around the cluster sets the odds")
        half = growth.mask_of(rows, cols, order, len(order) // 2)
        tree = topic07.cells_group(order[:len(order) // 2], box, pitch)
        glow = topic07.field_image(growth.field(rows, cols, half), box)
        self.play(FadeIn(cap), FadeIn(glow), FadeIn(tree), run_time=settings.MID)
        eq = txt("∇²φ = 0", settings.T11_LAP_EQ_X, settings.T11_LAP_EQ_Y,
                 settings.FORMULA_SCALE, GOLD_C)
        eq_name = txt("the field solves the Laplace equation outside the cluster",
                      settings.T11_LAP_EQ_X,
                      settings.T11_LAP_EQ_Y - settings.T11_LAP_NAME_DY, settings.NAME_SCALE,
                      MUTED)
        self.play(FadeIn(eq))
        self.play(FadeIn(eq_name))
        self.wait(0.5)

        rule = txt("chance ∝ (field gradient)ᵖ", settings.T11_LAP_EQ_X,
                   settings.T11_LAP_EQ_Y - settings.T11_LAP_RULE_DY, settings.EQ_SCALE, INK,
                   [(0, 6, BLUE_C), (7, 22, GOLD_C), (22, 23, CORAL_C)])
        self.play(FadeIn(rule))
        for i, eta in enumerate(settings.T11_LAP_ETAS):
            mb, mp = topic07.grid_box(rows, cols, settings.T11_LAP_MINI_H,
                                      ((i - 1) * settings.T11_LAP_MINI_DX,
                                       settings.T11_LAP_MINI_Y))
            _, o, _ = growth.dbm(rows, cols, eta, settings.T7_SEED)
            d, _ = growth.box_dim(o, settings.T7_BOX_SIZES)
            shape = topic07.cells_group(o, mb, mp)
            lbl = txt(f"p {eta}   dimension {d:.3f}", (i - 1) * settings.T11_LAP_MINI_DX,
                      settings.T11_LAP_LBL_Y, settings.NAME_SCALE, MUTED,
                      [(0, 1, CORAL_C), (1, 4, CORAL_C), (13, 30, GREEN_C)])
            self.play(FadeIn(shape), FadeIn(lbl), run_time=settings.FAST)
        note = common.top_note("one power in the rule, and the whole shape follows")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class EscapeProof(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        fr = topic09.Frame(settings.T11_RING_UNIT, (settings.T11_RING_X, settings.T11_RING_Y),
                           3, 3)
        cap = caption("once past the circle, every step grows")
        ring = Circle(radius=2 * settings.T11_RING_UNIT, arc_center=fr.at((0, 0)), color=GOLD_C,
                      stroke_width=settings.STROKE_GRID)
        self.play(FadeIn(cap), Create(fr.build()), Create(ring))
        start = settings.T11_ESC_START
        walk = topic09.orbit_of(start, settings.T11_ESC_C, 4)
        dots = VGroup(*[Dot(fr.at(p), color=CORAL_C, radius=settings.T8_DOT_R * 0.8)
                        for p in walk if abs(p[0]) < 3 and abs(p[1]) < 3])
        path = poly([fr.at(p) for p in walk if abs(p[0]) < 3 and abs(p[1]) < 3], CORAL_C, 1)
        self.play(LaggedStart(*[FadeIn(d) for d in dots], lag_ratio=0.4), Create(path),
                  run_time=settings.SLOW)
        self.wait(0.3)

        lines = (
            ("|z| > 2   and   |c| ≤ 2", [(1, 2, BLUE_C), (8, 9, GOLD_C)]),
            ("|z² + c| ≥ |z|² - |c|", [(1, 2, BLUE_C), (5, 6, GOLD_C)]),
            ("≥ |z|² - 2", [(2, 3, BLUE_C)]),
            ("> |z|", [(2, 3, BLUE_C)]),
        )
        for i, (body, spec) in enumerate(lines):
            line = txt(body, settings.T11_PROOF_X,
                       settings.T11_PROOF_Y - i * settings.T11_PROOF_DY, settings.EQ_SCALE,
                       INK, spec)
            self.play(FadeIn(line), run_time=settings.FAST)
            self.wait(0.4)
        sizes = [np.hypot(*p) for p in topic09.orbit_of(start, settings.T11_ESC_C,
                                                        settings.T11_SIZE_N)]

        def log_at(value):
            frac = np.log10(max(value, 1.0)) / settings.T11_LOG_MAX
            return np.array([settings.T11_LOG_X0
                             + frac * (settings.T11_LOG_X1 - settings.T11_LOG_X0),
                             settings.T11_LOG_Y, 0])

        axis = Line(log_at(1), log_at(10 ** settings.T11_LOG_MAX), color=MUTED,
                    stroke_width=settings.STROKE_GRID)
        marks = VGroup(axis)
        for value in settings.T11_LOG_TICKS:
            spot = log_at(value)
            marks.add(Line(spot + DOWN * settings.T11_LOG_TICK_H,
                           spot + UP * settings.T11_LOG_TICK_H,
                           color=GOLD_C if value == 2 else MUTED))
            marks.add(txt(str(value), spot[0], spot[1] - settings.T11_LOG_LBL_DY,
                          settings.FRAC_SCALE, GOLD_C if value == 2 else MUTED))
        axis_lbl = txt("size of z", (settings.T11_LOG_X0 + settings.T11_LOG_X1) / 2,
                       settings.T11_LOG_Y + settings.T11_LOG_AXIS_DY,
                       settings.NAME_SCALE, MUTED)
        self.play(Create(marks), FadeIn(axis_lbl))
        for value in sizes:
            spot = log_at(value)
            landed = Dot(spot, color=CORAL_C, radius=settings.SCALE_DOT_R)
            tag = txt(f"{value:.2f}", spot[0], spot[1] + settings.T11_LOG_DOT_DY,
                      settings.NAME_SCALE, CORAL_C)
            self.play(FadeIn(landed), FadeIn(tag), run_time=settings.FAST)
        self.wait(0.4)
        self.play(Transform(cap, caption(
            "so the size grows without bound, and the point never returns")))
        self.wait(0.6)
        note = common.top_note("the escape test is now a proved fact")
        self.play(FadeIn(note))
        self.wait(1)


class SharedCondition(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        c = settings.T9_CS[0]
        jbox = topic09.screen_box(settings.T9_JULIA, settings.T11_JZ_H,
                                  (settings.T11_JZ_X, settings.T11_JZ_Y))
        mbox = topic09.screen_box(settings.T10_MAND, settings.T11_JZ_H,
                                  (settings.T11_MZ_X, settings.T11_JZ_Y))

        cap = caption("one condition, read on two pictures")
        julia = topic09.julia_image(c, settings.T9_JULIA, jbox)
        mand = topic09.flat_set_image(settings.T10_MAND, mbox)
        self.play(FadeIn(cap), FadeIn(julia), FadeIn(mand), run_time=settings.MID)
        j_lbl = txt("the Julia set for this c", settings.T11_JZ_X,
                    jbox[2] - 0.35, settings.NAME_SCALE, MUTED)
        m_lbl = txt("the Mandelbrot set", settings.T11_MZ_X, mbox[2] - 0.35,
                    settings.NAME_SCALE, MUTED)
        self.play(FadeIn(j_lbl), FadeIn(m_lbl))
        self.wait(0.3)

        walk = topic09.orbit_of((0.0, 0.0), c, settings.T11_ZERO_STEPS)
        x0, x1, y0, y1 = settings.T9_JULIA
        scr = [np.array([jbox[0] + (p[0] - x0) / (x1 - x0) * (jbox[1] - jbox[0]),
                         jbox[2] + (p[1] - y0) / (y1 - y0) * (jbox[3] - jbox[2]), 0])
               for p in walk]
        dots = VGroup(*[Dot(p, color=GREEN_C, radius=settings.T8_DOT_R) for p in scr])
        path = poly(scr, GREEN_C, 1)
        zero_lbl = txt("the walk that starts at zero", settings.T11_JZ_X, jbox[3] + 0.35,
                       settings.NAME_SCALE, GREEN_C)
        self.play(FadeIn(zero_lbl))
        self.play(LaggedStart(*[FadeIn(d) for d in dots], lag_ratio=0.25), Create(path),
                  run_time=settings.SLOW)
        mark = topic10_mark(c, mbox)
        self.play(FadeIn(mark))
        self.wait(0.3)
        claim = txt("the walk from zero stays bounded exactly when the set holds together", 0,
                    settings.T11_CLAIM_Y, settings.EQ_SCALE, MUTED)
        self.play(FadeIn(claim))
        note = common.top_note("the same condition, seen from both sides")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def topic10_mark(c, mbox):
    x0, x1, y0, y1 = settings.T10_MAND
    p = np.array([mbox[0] + (c[0] - x0) / (x1 - x0) * (mbox[1] - mbox[0]),
                  mbox[2] + (c[1] - y0) / (y1 - y0) * (mbox[3] - mbox[2]), 0])
    return VGroup(Dot(p, color=GOLD_C, radius=settings.T8_DOT_R),
                  txt("this c", p[0] + 0.8, p[1] + 0.4, settings.NAME_SCALE, GOLD_C))


def card(title, idea, foot, x):
    frame = Rectangle(width=settings.T11_CARD_W, height=settings.T11_CARD_H, color=MUTED,
                      stroke_width=settings.STROKE_GRID)
    frame.move_to([x, settings.T11_CARD_Y, 0])
    return VGroup(
        frame,
        txt(title, x, settings.T11_CARD_Y + settings.T11_CARD_TITLE_DY, settings.EQ_SCALE,
            BLUE_C),
        txt(idea, x, settings.T11_CARD_Y + settings.T11_CARD_IDEA_DY, settings.NAME_SCALE,
            INK),
        txt(foot, x, settings.T11_CARD_Y - settings.T11_CARD_FOOT_DY, settings.NAME_SCALE,
            MUTED),
    )


class HardTheorems(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("two results stated plainly, with the idea of each proof")
        left = card("the set is connected",
                    "the outside maps onto the outside of a disk",
                    "full proof beyond this series", -settings.T11_CARD_DX)
        right = card("the edge has dimension two",
                     "the edge is as rough as a curve can be",
                     "full proof beyond this series", settings.T11_CARD_DX)
        self.play(FadeIn(cap))
        self.play(FadeIn(left), run_time=settings.MID)
        self.wait(0.6)
        self.play(FadeIn(right), run_time=settings.MID)
        self.wait(0.6)
        names = txt(settings.T11_NAMES, 0, settings.T11_NAMES_Y, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(names))
        note = common.top_note("the meaning is concrete even where the proof is not shown")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1.5)
