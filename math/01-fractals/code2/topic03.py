import numpy as np
from manim import (
    Scene, Line, Rectangle, Square, VGroup,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, Transform, TransformFromCopy,
)

import settings
import coast
import common
import topic02
import topic04
from common import BLUE_C, GOLD_C, GREEN_C, MUTED, caption, poly, txt


def coast_data():
    return topic02.measured(settings.T2_MAIN, settings.T3_PHOTO_H,
                            (settings.T3_PHOTO_X, settings.T3_PHOTO_Y))


def box_sizes(pts, base=None, count=None):
    base = base if base is not None else settings.T3_BASE
    count = count if count is not None else settings.T3_N
    span = max(pts[:, 0].max() - pts[:, 0].min(), pts[:, 1].max() - pts[:, 1].min())
    return [span / (base * 2 ** k) for k in range(count)]


def anchor_of(pts):
    return np.asarray(pts)[:, :2].min(axis=0)


def occupied(pts, size):
    flat = np.asarray(pts)[:, :2]
    anchored = flat - flat.min(axis=0)
    return np.unique(np.floor(anchored / size).astype(np.int64), axis=0)


def cells_of(cells, size, anchor, colour=GOLD_C):
    group = VGroup()
    for cx, cy in cells:
        cell = Square(side_length=size, stroke_width=1, color=colour)
        cell.set_fill(colour, opacity=settings.T3_CELL_FILL)
        cell.move_to([anchor[0] + (cx + 0.5) * size, anchor[1] + (cy + 0.5) * size, 0])
        group.add(cell)
    return group


def grid_over(box, size, colour=MUTED):
    lines = VGroup()
    x = np.floor(box[0] / size) * size
    while x <= box[1]:
        lines.add(Line([x, box[2], 0], [x, box[3], 0], color=colour, stroke_width=1))
        x += size
    y = np.floor(box[2] / size) * size
    while y <= box[3]:
        lines.add(Line([box[0], y, 0], [box[1], y, 0], color=colour, stroke_width=1))
        y += size
    return lines


def table_row(size, count, index, x=None):
    x = x if x is not None else settings.T3_READ_X
    body = f"{size:.2f}  →  {count} boxes"
    return txt(body, x, settings.T3_TAB_Y - index * settings.T3_TAB_DY,
               settings.EQ_SCALE, MUTED, [(0, 4, GOLD_C), (5, 30, BLUE_C)])


class GridOverCoast(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        data = coast_data()
        pts = data["screen"]
        sizes = box_sizes(pts)
        size = sizes[0]

        cap = caption("drop a grid over the coast and count what it touches")
        photo = topic02.photo_of(data, settings.T3_PHOTO_ALPHA)
        line = topic02.trace_of(data)
        self.play(FadeIn(cap), FadeIn(photo))
        self.play(Create(line), run_time=settings.MID)

        grid = grid_over(data["box"], size)
        self.play(Create(grid), run_time=settings.MID)
        cells = occupied(pts, size)
        shaded = cells_of(cells, size, anchor_of(pts))
        count = common.readout("boxes touched:", "0", settings.T3_READ_X,
                               settings.T3_READ_Y, BLUE_C)
        self.play(FadeIn(count))
        self.play(LaggedStart(*[FadeIn(c) for c in shaded], lag_ratio=0.06),
                  Transform(count[1], common.value_like(count, f"{len(cells)}", BLUE_C)),
                  run_time=settings.SLOW * 1.5)
        self.bring_to_front(line)
        self.wait(0.5)

        anchor = pts[int(len(pts) * settings.T2_ZOOM_FRAC)]
        half = settings.T3_ZOOM_HALF
        target = np.array([settings.T3_ZOOM_T[0], settings.T3_ZOOM_T[1], 0])
        k = settings.T3_ZOOM_SIZE / (2 * half)
        near = [p for p in pts if abs(p[0] - anchor[0]) <= half
                and abs(p[1] - anchor[1]) <= half]
        if len(near) > 2:
            blown = poly([target + (p - anchor) * k for p in near], BLUE_C,
                         settings.T2_LINE_W + 1)
            src = Rectangle(width=2 * half, height=2 * half, color=common.INK,
                            stroke_width=settings.STROKE_GRID).move_to(anchor)
            dst = Rectangle(width=settings.T3_ZOOM_SIZE, height=settings.T3_ZOOM_SIZE,
                            color=common.INK,
                            stroke_width=settings.STROKE_GRID).move_to(target)
            self.play(Create(src))
            self.play(Create(dst), FadeIn(blown), run_time=settings.MID)
            hit = txt("a box counts if any coast passes through it", settings.T3_ZOOM_T[0],
                      settings.T3_ZOOM_T[1] - settings.T3_ZOOM_SIZE / 2 - 0.35,
                      settings.NAME_SCALE, MUTED)
            self.play(FadeIn(hit))
        note = common.top_note("no rulers, no walking - just counting boxes")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class FinerBoxes(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        data = coast_data()
        pts = data["screen"]
        sizes = box_sizes(pts)

        cap = caption("halve the box and count again")
        photo = topic02.photo_of(data, settings.T3_PHOTO_ALPHA)
        line = topic02.trace_of(data)
        self.play(FadeIn(cap), FadeIn(photo), Create(line), run_time=settings.MID)

        shown = None
        rows = VGroup()
        for i, size in enumerate(sizes):
            cells = occupied(pts, size)
            if len(cells) <= settings.T3_CELL_LIMIT:
                block = VGroup(grid_over(data["box"], size), cells_of(cells, size, anchor_of(pts)))
            else:
                block = cells_of(cells, size, anchor_of(pts))
            if shown is None:
                self.play(FadeIn(block), run_time=settings.MID)
            else:
                self.play(FadeOut(shown), FadeIn(block), run_time=settings.MID)
            self.bring_to_front(line)
            row = table_row(size, len(cells), i)
            rows.add(row)
            self.play(FadeIn(row), run_time=settings.FAST)
            shown = block
            self.wait(0.6)

        self.play(Indicate(rows, color=BLUE_C))
        note = common.top_note("halving the box more than doubles the count")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class LogRatio(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        data = coast_data()
        pts = data["screen"]
        sizes = box_sizes(pts)
        counts = [len(occupied(pts, s)) for s in sizes]

        cap = caption("the counts and the sizes give one number")
        photo = topic02.photo_of(data, settings.T3_PHOTO_ALPHA - 40)
        line = topic02.trace_of(data)
        self.play(FadeIn(cap), FadeIn(photo), Create(line), run_time=settings.MID)
        rows = VGroup(*[table_row(s, c, i) for i, (s, c) in enumerate(zip(sizes, counts))])
        self.play(LaggedStart(*[FadeIn(r) for r in rows], lag_ratio=0.2), run_time=settings.MID)

        plot = common.LogLog(settings.T3_PLOT_X, settings.T3_PLOT_Y,
                             xlabel="box size", ylabel="boxes touched")
        slope, inter = plot.fit(sizes, counts)
        dim = -slope
        self.play(Create(plot.build()))
        dots = plot.dots(sizes, counts, GOLD_C)
        self.play(LaggedStart(*[TransformFromCopy(r, d) for r, d in zip(rows, dots)],
                              lag_ratio=0.2), run_time=settings.SLOW)
        fit = plot.fit_line(sizes, slope, inter, GREEN_C)
        self.play(Create(fit))
        rel = txt("d = log boxes / log (1/box)", settings.T3_REL_X, settings.T3_REL_Y,
                  settings.NAME_SCALE + 0.14, MUTED,
                  [(0, 1, GREEN_C), (5, 10, BLUE_C), (14, 21, GOLD_C)])
        value = txt(f"d = {dim:.3f}", settings.T3_REL_X,
                    settings.T3_REL_Y - settings.T3_REL_DY, settings.FORMULA_SCALE, GREEN_C)
        self.play(FadeIn(rel))
        self.play(TransformFromCopy(fit, value))
        agree = txt(f"the divider walk gave {settings.T4_COAST_D:.3f}", settings.T3_REL_X,
                    settings.T3_REL_Y - 1.75 * settings.T3_REL_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(agree), FadeOut(cap))
        note = common.top_note("a different method, the same answer")
        self.play(FadeIn(note))
        self.wait(1)


def ordinary_body(scene):
    made = VGroup()
    size = settings.T3_ORD_SIZE
    ns = settings.T3_ORD_NS
    for slot, name in enumerate(("a line", "a square", "a cube")):
        x = settings.T3_ORD_XS[slot]
        lbl = txt(name, x, settings.T3_ORD_Y + size * 0.85, settings.EQ_SCALE, MUTED)
        made.add(lbl)
        scene.play(FadeIn(lbl), run_time=settings.FAST)

    for step, n in enumerate(ns):
        drawn = VGroup()
        pieces = []
        for slot in range(3):
            x = settings.T3_ORD_XS[slot]
            if slot == 0:
                piece = VGroup(*[
                    Line([x - size / 2 + i * size / n, settings.T3_ORD_Y, 0],
                         [x - size / 2 + (i + 1) * size / n, settings.T3_ORD_Y, 0],
                         color=BLUE_C, stroke_width=settings.STROKE_MAIN)
                    for i in range(n)])
                count = n
            elif slot == 1:
                piece = VGroup()
                for i in range(n):
                    for j in range(n):
                        cell = Square(side_length=size / n, stroke_width=1, color=BLUE_C)
                        cell.set_fill(BLUE_C, opacity=settings.T3_CELL_FILL)
                        cell.move_to([x - size / 2 + (i + 0.5) * size / n,
                                      settings.T3_ORD_Y - size / 2 + (j + 0.5) * size / n,
                                      0])
                        piece.add(cell)
                count = n * n
            else:
                step_len = size / n
                centres = [(np.array([i, j, k], dtype=float) - (n - 1) / 2) * step_len
                           for i in range(n) for j in range(n) for k in range(n)
                           if i in (0, n - 1) or j in (0, n - 1) or k in (0, n - 1)]
                piece = common.solid(centres, step_len * settings.T6_MENGER_FILL,
                                     settings.TILT_X, settings.TILT_Y,
                                     (x, settings.T3_ORD_Y))
                count = n ** 3
            drawn.add(piece)
            pieces.append(piece)
            row = txt(f"{n} across  →  {count}", x, settings.T3_ORD_ROW_Y
                      - step * settings.T3_ORD_ROW_DY, settings.EQ_SCALE, MUTED,
                      [(0, len(str(n)), GOLD_C), (len(str(n)) + 7, 40, BLUE_C)])
            drawn.add(row)
        made.add(drawn)
        scene.play(FadeIn(drawn), run_time=settings.MID)
        scene.wait(0.5)
        if step < len(ns) - 1:
            scene.play(*[FadeOut(piece) for piece in pieces], run_time=settings.FAST)

    for slot in range(3):
        counts = [n ** (slot + 1) for n in ns]
        slope = -np.polyfit(np.log([1 / n for n in ns]), np.log(counts), 1)[0]
        value = txt(f"d = {slope:.3f}", settings.T3_ORD_XS[slot], settings.T3_ORD_D_Y,
                    settings.FORMULA_SCALE, GREEN_C)
        made.add(value)
        scene.play(FadeIn(value), run_time=settings.FAST)
    return made


class OrdinaryCheck(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("try it on shapes whose dimension is already known")
        self.play(FadeIn(cap))
        ordinary_body(self)
        note = common.top_note("one, two and three, exactly as they should be")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class ExactVersusMeasured(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("the same method on a built curve and on a real coast")

        koch = topic04.koch_span(settings.T3_KOCH_H * 2.4, settings.T3_PAIR_Y,
                                settings.T3_KOCH_LEVEL)
        koch = [p + np.array([-settings.T3_PAIR_DX, 0, 0]) for p in koch]
        kpts = np.array(koch)
        curve = poly(koch, BLUE_C, settings.STROKE_GRID)
        data = topic02.measured(settings.T2_MAIN, settings.T3_KOCH_H * 1.9,
                                (settings.T3_PAIR_DX, settings.T3_PAIR_Y))
        line = topic02.trace_of(data)
        self.play(FadeIn(cap), Create(curve), Create(line), run_time=settings.MID)

        ksizes = box_sizes(kpts)
        kcounts = [len(occupied(kpts, s)) for s in ksizes]
        csizes = box_sizes(data["screen"])
        ccounts = [len(occupied(data["screen"], s)) for s in csizes]

        left = common.LogLog(-settings.T3_PAIR_DX, settings.T3_PAIR_PLOT_Y,
                             xlabel="box size", ylabel="boxes")
        right = common.LogLog(settings.T3_PAIR_DX, settings.T3_PAIR_PLOT_Y,
                              xlabel="box size", ylabel="boxes")
        ks, ki = left.fit(ksizes, kcounts)
        cs, ci = right.fit(csizes, ccounts)
        self.play(Create(left.build()), Create(right.build()))
        self.play(FadeIn(left.dots(ksizes, kcounts, GOLD_C)),
                  FadeIn(right.dots(csizes, ccounts, GOLD_C)))
        self.play(Create(left.fit_line(ksizes, ks, ki, GREEN_C)),
                  Create(right.fit_line(csizes, cs, ci, GREEN_C)))
        exact = float(np.log(4) / np.log(3))
        labels = VGroup(
            txt(f"measured {-ks:.3f}", -settings.T3_PAIR_DX, settings.T3_LBL_Y,
                settings.EQ_SCALE, GREEN_C),
            txt(f"exact {exact:.3f}", -settings.T3_PAIR_DX,
                settings.T3_LBL_Y - settings.T3_ORD_ROW_DY, settings.NAME_SCALE, MUTED),
            txt(f"measured {-cs:.3f}", settings.T3_PAIR_DX, settings.T3_LBL_Y,
                settings.EQ_SCALE, GREEN_C),
            txt("no exact value to check against", settings.T3_PAIR_DX,
                settings.T3_LBL_Y - settings.T3_ORD_ROW_DY, settings.NAME_SCALE, MUTED),
        )
        self.play(LaggedStart(*[FadeIn(m) for m in labels], lag_ratio=0.25),
                  run_time=settings.MID)
        note = common.top_note("one method, whether an exact value exists or not")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def similarity_body(scene):
    koch = topic04.koch_span(settings.T3_KOCH_H * 2.6, settings.T3_SS_Y,
                             settings.T3_KOCH_LEVEL - 2)
    curve = poly(koch, BLUE_C, settings.STROKE_GRID)
    scene.play(Create(curve), run_time=settings.MID)

    facts = VGroup(
        txt("4 copies", -settings.T3_PAIR_DX, settings.T3_SS_Y - settings.T3_SS_DY * 2,
            settings.EQ_SCALE, BLUE_C),
        txt("each 1/3 the size", settings.T3_PAIR_DX,
            settings.T3_SS_Y - settings.T3_SS_DY * 2, settings.EQ_SCALE, GOLD_C),
    )
    scene.play(FadeIn(facts))
    rel, value = common.dim_text(4, 3, 0, settings.T3_SS_Y - settings.T3_SS_DY * 3.2)
    scene.play(FadeIn(rel))
    scene.wait(0.4)

    kpts = np.array(topic04.koch_span(settings.T3_KOCH_H * 2.4, 0.0,
                                      settings.T3_KOCH_LEVEL))
    sizes = box_sizes(kpts)
    counted = -np.polyfit(np.log(sizes),
                          np.log([len(occupied(kpts, s)) for s in sizes]), 1)[0]
    check = txt(f"counting boxes gave {counted:.3f}", 0,
                settings.T3_SS_Y - settings.T3_SS_DY * 4.3, settings.NAME_SCALE, MUTED)
    scene.play(FadeIn(check))
    scene.wait(0.5)

    name = txt("the exact notion behind both is the Hausdorff dimension", 0,
               settings.T3_SS_Y - settings.T3_SS_DY * 5.3, settings.EQ_SCALE, GREEN_C)
    unit = txt("a pure number, the same whatever unit the shape is measured in", 0,
               settings.T3_SS_Y - settings.T3_SS_DY * 6.2, settings.NAME_SCALE, MUTED)
    scene.play(FadeIn(name))
    scene.play(FadeIn(unit))


class SelfSimilarity(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("when the rule is known, no counting is needed")
        self.play(FadeIn(cap))
        similarity_body(self)
        note = common.top_note("counted, or read straight off the rule")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class BoxCountingStory(Scene):
    def setup_coast(self):
        data = coast_data()
        photo = topic02.photo_of(data, settings.T3_PHOTO_ALPHA)
        line = topic02.trace_of(data)
        return data, photo, line

    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        data, photo, line = self.setup_coast()
        pts = data["screen"]
        base = anchor_of(pts)
        sizes = box_sizes(pts)
        counts = [len(occupied(pts, s)) for s in sizes]

        cap = caption("drop a grid over the coast and count what it touches")
        self.play(FadeIn(cap), FadeIn(photo))
        self.play(Create(line), run_time=settings.SLOW)
        self.wait(0.4)

        grid = grid_over(data["box"], sizes[0])
        self.play(Create(grid), run_time=settings.MID)
        count = common.readout("boxes touched:", "0", settings.T3_READ_X,
                               settings.T3S_COUNT_Y, BLUE_C)
        self.play(FadeIn(count))
        shaded = cells_of(occupied(pts, sizes[0]), sizes[0], base)
        self.play(LaggedStart(*[FadeIn(c) for c in shaded], lag_ratio=0.05),
                  Transform(count[1], common.value_like(count, f"{counts[0]}", BLUE_C)),
                  run_time=settings.SLOW * 1.4)
        self.bring_to_front(line)
        self.wait(settings.T3S_HOLD)

        anchor = pts[int(len(pts) * settings.T2_ZOOM_FRAC)]
        half = settings.T3_ZOOM_HALF
        target = np.array([settings.T3_ZOOM_T[0], settings.T3_ZOOM_T[1], 0])
        k = settings.T3_ZOOM_SIZE / (2 * half)
        near = [p for p in pts if abs(p[0] - anchor[0]) <= half
                and abs(p[1] - anchor[1]) <= half]
        zoom = VGroup()
        if len(near) > 2:
            blown = poly([target + (p - anchor) * k for p in near], BLUE_C,
                         settings.T2_LINE_W + 1)
            src = Rectangle(width=2 * half, height=2 * half, color=common.INK,
                            stroke_width=settings.STROKE_GRID).move_to(anchor)
            dst = Rectangle(width=settings.T3_ZOOM_SIZE, height=settings.T3_ZOOM_SIZE,
                            color=common.INK,
                            stroke_width=settings.STROKE_GRID).move_to(target)
            hit = txt("a box counts if any coast runs through it", settings.T3_ZOOM_T[0],
                      settings.T3_ZOOM_T[1] - settings.T3_ZOOM_SIZE / 2 - 0.35,
                      settings.NAME_SCALE, MUTED)
            zoom.add(src, dst, blown, hit)
            self.play(Create(src))
            self.play(Create(dst), FadeIn(blown), FadeIn(hit), run_time=settings.MID)
            self.wait(settings.T3S_HOLD)
            self.play(FadeOut(zoom), run_time=settings.FAST)

        self.play(Transform(cap, caption("halve the box and count again")))
        rows = VGroup(txt(f"{sizes[0]:.2f}  →  {counts[0]} boxes", settings.T3_READ_X,
                          settings.T3S_TAB_Y, settings.EQ_SCALE, MUTED,
                          [(0, 4, GOLD_C), (5, 30, BLUE_C)]))
        self.play(FadeOut(count), FadeIn(rows[0]), run_time=settings.FAST)
        shown = VGroup(grid, shaded)
        for i, size in enumerate(sizes[1:], start=1):
            cells = occupied(pts, size)
            if len(cells) <= settings.T3_CELL_LIMIT:
                block = VGroup(grid_over(data["box"], size), cells_of(cells, size, base))
            else:
                block = cells_of(cells, size, base)
            row = txt(f"{size:.2f}  →  {len(cells)} boxes", settings.T3_READ_X,
                      settings.T3S_TAB_Y - i * settings.T3S_TAB_DY, settings.EQ_SCALE, MUTED,
                      [(0, 4, GOLD_C), (5, 30, BLUE_C)])
            rows.add(row)
            self.play(FadeOut(shown), FadeIn(block), run_time=settings.MID)
            self.bring_to_front(line)
            self.play(FadeIn(row), run_time=settings.FAST)
            shown = block
            self.wait(settings.T3S_HOLD)
        self.play(FadeOut(shown))

        self.play(Transform(cap, caption("the counts and the sizes give one number")))
        plot = common.LogLog(settings.T3S_PLOT_X, settings.T3S_PLOT_Y,
                             xlabel="box size", ylabel="boxes touched")
        slope, inter = plot.fit(sizes, counts)
        dim = -slope
        axes = plot.build()
        self.play(Create(axes))
        dots = plot.dots(sizes, counts, GOLD_C)
        self.play(LaggedStart(*[TransformFromCopy(r, d) for r, d in zip(rows, dots)],
                              lag_ratio=0.2), run_time=settings.SLOW)
        fit = plot.fit_line(sizes, slope, inter, GREEN_C)
        self.play(Create(fit))
        value = txt(f"d = {dim:.3f}", settings.T3_READ_X, settings.T3S_REL_Y,
                    settings.FORMULA_SCALE, GREEN_C)
        agree = txt(f"the divider walk gave {settings.T4_COAST_D:.3f}", settings.T3_READ_X,
                    settings.T3S_REL_Y - settings.T3S_REL_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeOut(rows), FadeIn(value))
        self.play(FadeIn(agree))
        self.wait(settings.T3S_HOLD * 1.5)

        self.play(FadeOut(photo), FadeOut(line), FadeOut(axes), FadeOut(dots),
                  FadeOut(fit), FadeOut(value), FadeOut(agree),
                  Transform(cap, caption("try it where the answer is already known")))
        ordinary = ordinary_body(self)

        self.play(FadeOut(ordinary), Transform(cap, caption("when the rule is known, no counting is needed")))
        similarity_body(self)
        note = common.top_note("counted, or read straight off the rule")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1.2)
