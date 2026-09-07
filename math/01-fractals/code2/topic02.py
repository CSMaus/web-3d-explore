import numpy as np
from manim import (
    Scene, Arc, Dot, Line, Rectangle, VGroup,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, Transform, TransformFromCopy,
)

import settings
import coast
import common
from common import BLUE_C, GOLD_C, GREEN_C, CORAL_C, MUTED, caption, poly, txt


def measured(name, height=None, centre=None):
    height = height if height is not None else settings.T2_PHOTO_H
    centre = centre if centre is not None else (settings.T2_PHOTO_X, settings.T2_PHOTO_Y)
    img, mask, pts, cfg = coast.outline(name)
    box = coast.photo_box(img.size, height, centre)
    screen = coast.to_screen(pts, img.size, height, centre)
    span = max(pts[:, 0].max() - pts[:, 0].min(), pts[:, 1].max() - pts[:, 1].min())
    scale = (box[3] - box[2]) / img.size[1]
    steps = [span * scale / (settings.T2_OPEN_BASE * 2 ** k)
             for k in range(settings.T2_OPEN_N)]
    walks = [common.chord_walk(screen, s) for s in steps]
    totals = [w[1] for w in walks]
    slope, inter = np.polyfit(np.log(steps), np.log(totals), 1)
    return {
        "img": img, "box": box, "screen": screen, "steps": steps, "walks": walks,
        "totals": totals, "slope": float(slope), "inter": float(inter),
        "dim": float(1 - slope), "closed": not cfg["open_border"],
    }


def photo_of(data, alpha=None):
    alpha = alpha if alpha is not None else settings.T2_PHOTO_ALPHA
    return common.image_at(coast.photo_array(data["img"], alpha), data["box"])


def trace_of(data, colour=BLUE_C, width=None):
    line = poly(data["screen"], colour, width if width else settings.T2_LINE_W)
    return line


def chords_of(walk, colour=GOLD_C):
    anchors = walk[0]
    return VGroup(*[Line(a, b, color=colour, stroke_width=settings.T2_CHORD_W)
                    for a, b in zip(anchors, anchors[1:])])


def opening_bar(step, x, y):
    bar = Line([x - step / 2, y, 0], [x + step / 2, y, 0], color=GOLD_C,
               stroke_width=settings.STROKE_MAIN)
    caps = VGroup(*[Line([x + s * step / 2, y - 0.12, 0], [x + s * step / 2, y + 0.12, 0],
                         color=GOLD_C) for s in (-1, 1)])
    return VGroup(bar, caps)


def row_of(step, count, total, index, x=None):
    x = x if x is not None else settings.T2_TAB_X
    body = f"{step:.2f}  →  {count} chords  →  {total:.1f}"
    return txt(body, x, settings.T2_TAB_Y - index * settings.T2_TAB_DY,
               settings.EQ_SCALE, MUTED,
               [(0, 4, GOLD_C), (5, 12, MUTED), (13, 40, BLUE_C)])


class DividerWalk(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        data = measured(settings.T2_MAIN)

        cap = caption("step along the coast with a fixed opening")
        photo = photo_of(data)
        line = trace_of(data)
        self.play(FadeIn(cap), FadeIn(photo))
        self.play(Create(line), run_time=settings.SLOW)
        self.wait(0.4)

        shown = None
        rows = VGroup()
        for i, (step, walk) in enumerate(zip(data["steps"], data["walks"])):
            anchors, total = walk
            bar = opening_bar(step, settings.T2_READ_X + 0.9, settings.T2_READ_Y)
            bar_lbl = txt(f"opening {step:.2f}", settings.T2_READ_X + 0.9,
                          settings.T2_READ_Y - settings.T2_READ_DY, settings.EQ_SCALE, GOLD_C)
            chords = chords_of(walk)
            if shown is None:
                self.play(FadeIn(bar), FadeIn(bar_lbl))
                self.play(LaggedStart(*[Create(c) for c in chords], lag_ratio=0.12),
                          run_time=settings.SLOW * 1.5)
            else:
                self.play(FadeOut(shown[0]), FadeOut(shown[1]), FadeOut(shown[2]),
                          FadeIn(bar), FadeIn(bar_lbl), run_time=settings.FAST)
                self.play(Create(chords), run_time=settings.MID)
            row = row_of(step, len(anchors) - 1, total, i)
            rows.add(row)
            self.play(FadeIn(row), run_time=settings.FAST)
            shown = (chords, bar, bar_lbl)
            self.wait(0.3)

        self.play(Transform(cap, caption("the finer the opening, the longer the coast")))
        self.play(Indicate(rows, color=BLUE_C))
        self.wait(0.5)

        anchor = data["screen"][int(len(data["screen"]) * settings.T2_ZOOM_FRAC)]
        half = settings.T2_ZOOM_HALF
        target = np.array([settings.T2_ZOOM_T[0], settings.T2_ZOOM_T[1], 0])
        k = settings.T2_ZOOM_SIZE / (2 * half)
        near = [p for p in data["screen"]
                if abs(p[0] - anchor[0]) <= half and abs(p[1] - anchor[1]) <= half]
        if len(near) > 2:
            blown = poly([target + (p - anchor) * k for p in near], BLUE_C,
                         settings.T2_LINE_W + 1)
            src = Rectangle(width=2 * half, height=2 * half, color=MUTED,
                            stroke_width=settings.STROKE_GRID).move_to(anchor)
            dst = Rectangle(width=settings.T2_ZOOM_SIZE, height=settings.T2_ZOOM_SIZE,
                            color=MUTED, stroke_width=settings.STROKE_GRID).move_to(target)
            self.play(Create(src))
            self.play(Create(dst), FadeIn(blown), run_time=settings.MID)
        note = common.top_note("a wide opening steps over what a narrow one follows")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class SmoothVsCoast(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        data = measured(settings.T2_MAIN, settings.T2_COAST_H,
                        (settings.T2_COAST_X, settings.T2_SMOOTH_Y))

        cap = caption("do the same to a smooth curve")
        centre = np.array([settings.T2_SMOOTH_X, settings.T2_SMOOTH_Y, 0])
        angles = np.linspace(np.pi, 0, 500)
        arc_pts = [centre + settings.T2_SMOOTH_R * np.array([np.cos(a), np.sin(a), 0])
                   for a in angles]
        arc = poly(arc_pts, GREEN_C, settings.T2_LINE_W + 1)
        line = trace_of(data)
        self.play(FadeIn(cap), Create(arc), Create(line), run_time=settings.MID)

        smooth_read = common.readout("smooth curve:", "0.0", settings.T2_SMOOTH_X - 1.9,
                                     settings.T2_SM_READ_Y, GREEN_C)
        coast_read = common.readout("coastline:", "0.0", settings.T2_COAST_X - 1.4,
                                    settings.T2_SM_READ_Y, CORAL_C)
        self.play(FadeIn(smooth_read), FadeIn(coast_read))

        for step in data["steps"]:
            arc_walk = common.chord_walk(arc_pts, step)
            coast_walk = common.chord_walk(data["screen"], step)
            a_ch = chords_of(arc_walk, GREEN_C)
            c_ch = chords_of(coast_walk, CORAL_C)
            self.play(
                FadeIn(a_ch), FadeIn(c_ch),
                Transform(smooth_read[1],
                          common.value_like(smooth_read, f"{arc_walk[1]:.1f}", GREEN_C)),
                Transform(coast_read[1],
                          common.value_like(coast_read, f"{coast_walk[1]:.1f}", CORAL_C)),
                run_time=settings.MID,
            )
            self.wait(0.4)
            self.play(FadeOut(a_ch), FadeOut(c_ch), run_time=settings.FAST)
        note = common.top_note("one settles on a length, the other never does")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class RichardsonPlot(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        data = measured(settings.T2_MAIN, settings.T2_COAST_H,
                        (settings.T2_PHOTO_X, settings.T2_PHOTO_Y))

        cap = caption("put every opening and every total on one plot")
        photo = photo_of(data, settings.T2_PHOTO_ALPHA - 40)
        line = trace_of(data)
        self.play(FadeIn(cap), FadeIn(photo), Create(line), run_time=settings.MID)

        plot = common.LogLog(settings.T2_PLOT_X, settings.T2_PLOT_Y,
                             xlabel="opening", ylabel="measured length")
        slope, inter = plot.fit(data["steps"], data["totals"])
        self.play(Create(plot.build()))
        dots = plot.dots(data["steps"], data["totals"], GOLD_C)
        for i, dot in enumerate(dots):
            self.play(FadeIn(dot), run_time=settings.FAST)
        self.wait(0.4)
        fit = plot.fit_line(data["steps"], slope, inter, GREEN_C)
        self.play(Create(fit))
        slope_lbl = txt(f"slope {slope:.3f}", settings.T2_PLOT_X, settings.T2_SLOPE_Y,
                        settings.FORMULA_SCALE, GREEN_C)
        self.play(FadeIn(slope_lbl), Indicate(fit, color=GREEN_C))
        note = common.top_note("the points fall on a straight line, and its slope is the whole story")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class DimensionFromSlope(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        data = measured(settings.T2_MAIN, settings.T2_COAST_H,
                        (settings.T2_PHOTO_X, settings.T2_PHOTO_Y))
        slope = data["slope"]
        dim = data["dim"]

        cap = caption("the slope names a dimension")
        photo = photo_of(data, settings.T2_PHOTO_ALPHA - 60)
        line = trace_of(data)
        self.play(FadeIn(cap), FadeIn(photo), Create(line), run_time=settings.MID)

        rows = VGroup(
            txt(f"slope  {slope:.3f}", settings.T2_READ_X + 1.0, settings.T2_READ_Y,
                settings.EQ_SCALE, GREEN_C),
            txt("d = 1 - slope", settings.T2_READ_X + 1.0,
                settings.T2_READ_Y - settings.T2_READ_DY, settings.EQ_SCALE, MUTED,
                [(0, 1, GREEN_C)]),
            txt(f"d = {dim:.3f}", settings.T2_READ_X + 1.0,
                settings.T2_READ_Y - 2.2 * settings.T2_READ_DY, settings.FORMULA_SCALE,
                GREEN_C),
        )
        for row in rows:
            self.play(FadeIn(row), run_time=settings.FAST)
            self.wait(0.3)

        sc = common.Scale1to2(y=settings.T2_SCALE_Y, length=settings.T2_SCALE_LEN,
                              x=settings.T2_SCALE_X)
        self.play(Create(sc.build()), FadeOut(cap))
        marks = VGroup(
            sc.mark(1.0, "a straight line", MUTED, False),
            sc.mark(dim, f"this coast {dim:.3f}", GREEN_C, True),
            sc.mark(2.0, "a filled square", MUTED, True),
        )
        self.play(LaggedStart(*[FadeIn(m) for m in marks], lag_ratio=0.3), run_time=settings.MID)
        note = common.top_note("a coast is not a line, and this number says by how much")
        self.play(FadeIn(note))
        self.wait(1)


class ThreeCoasts(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("three coasts, the same measurement")
        self.play(FadeIn(cap))

        sc = common.Scale1to2(y=settings.T2_SCALE_Y)
        self.play(Create(sc.build()))
        for i, name in enumerate(settings.T2_COASTS):
            centre = ((i - 1) * settings.T2_TRIO_DX, settings.T2_TRIO_Y)
            data = measured(name, settings.T2_TRIO_H, centre)
            photo = photo_of(data, settings.T2_PHOTO_ALPHA - 30)
            line = trace_of(data)
            lbl = txt(name, centre[0], centre[1] - settings.T2_TRIO_LBL_DY,
                      settings.NAME_SCALE, MUTED)
            self.play(FadeIn(photo), Create(line), FadeIn(lbl), run_time=settings.MID)
            mark = sc.mark(data["dim"], f"{data['dim']:.3f}", GREEN_C, i % 2 == 0)
            self.play(FadeIn(mark), run_time=settings.FAST)
            self.wait(0.5)
        note = common.top_note("the rougher the coast, the further from a plain line")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1.2)


class CoastlineStory(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        data = measured(settings.T2_MAIN)
        photo = photo_of(data)
        line = trace_of(data)

        cap = caption("step along the coast with a fixed opening")
        self.play(FadeIn(cap), FadeIn(photo))
        self.play(Create(line), run_time=settings.SLOW)
        self.wait(0.4)

        shown = None
        rows = VGroup()
        for i, (step, walk) in enumerate(zip(data["steps"], data["walks"])):
            anchors, total = walk
            bar = opening_bar(step, settings.T2_READ_X + 0.9, settings.T2S_BAR_Y)
            bar_lbl = txt(f"opening {step:.2f}", settings.T2_READ_X + 0.9,
                          settings.T2S_BAR_Y - 0.45, settings.EQ_SCALE, GOLD_C)
            chords = chords_of(walk)
            if shown is None:
                self.play(FadeIn(bar), FadeIn(bar_lbl))
                self.play(LaggedStart(*[Create(c) for c in chords], lag_ratio=0.1),
                          run_time=settings.SLOW * 1.4)
            else:
                self.play(FadeOut(shown[0]), FadeOut(shown[1]), FadeOut(shown[2]),
                          FadeIn(bar), FadeIn(bar_lbl), run_time=settings.FAST)
                self.play(Create(chords), run_time=settings.MID)
            row = txt(f"{step:.2f}  →  {len(anchors) - 1} chords  →  {total:.1f}",
                      settings.T2_TAB_X, settings.T2S_TAB_Y - i * settings.T2S_TAB_DY,
                      settings.EQ_SCALE, MUTED,
                      [(0, 4, GOLD_C), (5, 12, MUTED), (13, 40, BLUE_C)])
            rows.add(row)
            self.play(FadeIn(row), run_time=settings.FAST)
            shown = (chords, bar, bar_lbl)
            self.wait(settings.T2S_HOLD)
        self.play(FadeOut(shown[0]), FadeOut(shown[1]), FadeOut(shown[2]))
        self.play(Transform(cap, caption("the finer the opening, the longer the coast")),
                  Indicate(rows, color=BLUE_C))
        self.wait(settings.T2S_HOLD)

        self.play(Transform(cap, caption("a smooth curve settles, this one does not")))
        self.play(FadeOut(rows))
        centre = np.array([settings.T2S_ARC_X, settings.T2S_ARC_Y, 0])
        angles = np.linspace(np.pi, 0, 400)
        arc_pts = [centre + settings.T2S_ARC_R * np.array([np.cos(a), np.sin(a), 0])
                   for a in angles]
        arc = poly(arc_pts, GREEN_C, settings.T2_LINE_W + 1)
        arc_read = common.readout("smooth curve:", "0.0", settings.T2S_ARC_X - 1.9,
                                  settings.T2S_READ_Y, GREEN_C)
        coast_read = common.readout("coastline:", "0.0", settings.T2S_ARC_X - 1.9,
                                    settings.T2S_READ_Y - 0.6, CORAL_C)
        self.play(Create(arc), FadeIn(arc_read), FadeIn(coast_read))
        for step, walk in zip(data["steps"], data["walks"]):
            arc_walk = common.chord_walk(arc_pts, step)
            a_ch = chords_of(arc_walk, GREEN_C)
            c_ch = chords_of(walk, CORAL_C)
            self.play(
                FadeIn(a_ch), FadeIn(c_ch),
                Transform(arc_read[1],
                          common.value_like(arc_read, f"{arc_walk[1]:.1f}", GREEN_C)),
                Transform(coast_read[1],
                          common.value_like(coast_read, f"{walk[1]:.1f}", CORAL_C)),
                run_time=settings.MID,
            )
            self.wait(0.35)
            self.play(FadeOut(a_ch), FadeOut(c_ch), run_time=settings.FAST)
        self.wait(settings.T2S_HOLD)
        self.play(FadeOut(arc), FadeOut(arc_read), FadeOut(coast_read))

        self.play(Transform(cap, caption("put every opening and every total on one plot")))
        plot = common.LogLog(settings.T2S_PLOT_X, settings.T2S_PLOT_Y,
                             xlabel="opening", ylabel="measured length")
        slope, inter = plot.fit(data["steps"], data["totals"])
        axes = plot.build()
        self.play(Create(axes))
        dots = plot.dots(data["steps"], data["totals"], GOLD_C)
        self.play(LaggedStart(*[FadeIn(d) for d in dots], lag_ratio=0.25),
                  run_time=settings.MID)
        fit = plot.fit_line(data["steps"], slope, inter, GREEN_C)
        self.play(Create(fit))
        self.wait(settings.T2S_HOLD)

        self.play(Transform(cap, caption("the slope names a dimension")))
        steps_txt = VGroup(
            txt(f"slope  {slope:.3f}", settings.T2S_STEP_X, settings.T2S_TAB_Y,
                settings.EQ_SCALE, GREEN_C),
            txt("d = 1 - slope", settings.T2S_STEP_X,
                settings.T2S_TAB_Y - settings.T2S_TAB_DY, settings.EQ_SCALE, MUTED,
                [(0, 1, GREEN_C)]),
            txt(f"d = {data['dim']:.3f}", settings.T2S_STEP_X,
                settings.T2S_TAB_Y - 2.3 * settings.T2S_TAB_DY, settings.FORMULA_SCALE,
                GREEN_C),
        )
        for row in steps_txt:
            self.play(FadeIn(row), run_time=settings.FAST)
            self.wait(0.3)
        self.wait(settings.T2S_HOLD)

        self.play(FadeOut(photo), FadeOut(line), FadeOut(axes), FadeOut(dots), FadeOut(fit),
                  FadeOut(steps_txt),
                  Transform(cap, caption("three coasts, the same measurement")))
        sc = common.Scale1to2(y=settings.T2_SCALE_Y)
        self.play(Create(sc.build()))
        for i, name in enumerate(settings.T2_COASTS):
            spot = ((i - 1) * settings.T2_TRIO_DX, settings.T2_TRIO_Y)
            trio = measured(name, settings.T2_TRIO_H, spot)
            small = photo_of(trio, settings.T2_PHOTO_ALPHA - 30)
            edge = trace_of(trio)
            lbl = txt(name, spot[0], spot[1] - settings.T2_TRIO_LBL_DY,
                      settings.NAME_SCALE, MUTED)
            self.play(FadeIn(small), Create(edge), FadeIn(lbl), run_time=settings.MID)
            self.play(FadeIn(sc.mark(trio["dim"], f"{trio['dim']:.3f}", GREEN_C, i % 2 == 0)),
                      run_time=settings.FAST)
            self.wait(0.5)
        note = common.top_note("the rougher the coast, the further from a plain line")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1.2)
