import numpy as np
from manim import (
    Scene, Arrow, Dot, Line, Polygon, Rectangle, Square, VGroup,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, MoveAlongPath, ReplacementTransform,
    Transform, TransformFromCopy,
)

import settings
import common
from common import BLUE_C, GOLD_C, GREEN_C, CORAL_C, MUTED, caption, poly, txt

MAPS = settings.T5_MAPS
ROLE_COLOURS = (GOLD_C, BLUE_C, GREEN_C, CORAL_C)


def picks_of(n, seed):
    rng = np.random.default_rng(seed)
    return rng.choice(len(MAPS), size=n, p=list(settings.T5_PROBS))


def run_game(picks, start=(0.0, 0.0)):
    out = np.zeros((len(picks), 2))
    x, y = start
    for i, k in enumerate(picks):
        a, b, c, d, e, f = MAPS[k]
        x, y = a * x + b * y + e, c * x + d * y + f
        out[i] = (x, y)
    return out


def fern_extent(height, cx, cy):
    nx0, nx1, ny0, ny1 = settings.T5_NATIVE
    width = height * (nx1 - nx0) / (ny1 - ny0)
    return (cx - width / 2, cx + width / 2, cy - height / 2, cy + height / 2)


def to_screen(pts, extent):
    nx0, nx1, ny0, ny1 = settings.T5_NATIVE
    x0, x1, y0, y1 = extent
    out = np.empty_like(np.asarray(pts, dtype=float))
    out[:, 0] = x0 + (np.asarray(pts)[:, 0] - nx0) / (nx1 - nx0) * (x1 - x0)
    out[:, 1] = y0 + (np.asarray(pts)[:, 1] - ny0) / (ny1 - ny0) * (y1 - y0)
    return out


def one_screen(p, extent):
    return np.array([*to_screen(np.array([p]), extent)[0], 0])


def apply_map(pts, k, times):
    a, b, c, d, e, f = MAPS[k]
    out = np.asarray(pts, dtype=float).copy()
    for _ in range(times):
        x = a * out[:, 0] + b * out[:, 1] + e
        y = c * out[:, 0] + d * out[:, 1] + f
        out = np.stack([x, y], axis=1)
    return out


def cloud(pts, picks, extent, colours=ROLE_COLOURS, single=None):
    scr = to_screen(pts, extent)
    if single is None:
        cols = np.array([common.rgb(colours[k]) for k in picks], dtype=np.uint8)
    else:
        cols = np.tile(common.rgb(single), (len(scr), 1))
    return common.image_at(common.raster(scr, cols, extent), extent)


def map_eq(k, y, scale=None, x=None):
    scale = scale if scale is not None else settings.T5A_EQ_SCALE
    x = x if x is not None else settings.T5A_EQ_X
    a, b, c, d, e, f = MAPS[k]
    rows = VGroup()
    for i, (tag, u, v, w) in enumerate((("x'", a, b, e), ("y'", c, d, f))):
        rows.add(common.line_of(
            [(tag, GREEN_C), ("=", common.INK), (f"{u:.2f}", GOLD_C), ("x", BLUE_C),
             ("+", common.INK), (f"{v:.2f}", GOLD_C), ("y", BLUE_C), ("+", common.INK),
             (f"{w:.2f}", GOLD_C)], x, y - 0.5 * i, scale))
    return rows


def map_tile(k, origin, scale):
    a, b, c, d, e, f = MAPS[k]
    unit = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    base = Polygon(*[origin + np.array([u * scale, v * scale, 0]) for u, v in unit],
                   color=MUTED, stroke_width=settings.STROKE_GRID)
    sent = []
    for u, v in unit:
        sent.append(origin + np.array([(a * u + b * v + e) * scale,
                                       (c * u + d * v + f) * scale, 0]))
    img = Polygon(*sent, color=ROLE_COLOURS[k], stroke_width=settings.STROKE_GRID + 1)
    img.set_fill(ROLE_COLOURS[k], opacity=settings.T5_LEG_FILL)
    link = Arrow(base.get_center(), img.get_center(), color=MUTED, buff=0.05,
                 stroke_width=1, max_tip_length_to_length_ratio=0.15)
    lbl = txt(f"map {k + 1}", origin[0] + settings.T5_LEG_LBL_DX,
              origin[1] + settings.T5_LEG_LBL_DY, settings.NAME_SCALE, MUTED)
    return VGroup(base, img, link, lbl)


class FernIFS(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        extent = fern_extent(settings.T5_FERN_H, settings.T5_FERN_X, settings.T5_FERN_Y)
        picks = picks_of(settings.T5_STAGES[-1], settings.T5_SEED)
        pts = run_game(picks)

        cap = caption("one dot, four moves")
        legend = VGroup(*[
            map_tile(k, np.array([settings.T5_LEG_X, settings.T5_LEG_Y - k * settings.T5_LEG_DY, 0]),
                       settings.T5_LEG_S)
            for k in range(len(MAPS))
        ])
        self.play(FadeIn(cap))
        self.play(LaggedStart(*[FadeIn(g) for g in legend], lag_ratio=0.3), run_time=settings.MID)
        self.wait(0.5)

        seed = Dot(one_screen((0.0, 0.0), extent), color=BLUE_C, radius=settings.T5_DOT_R)
        cur = seed
        self.play(FadeIn(seed))
        trail = VGroup(seed)
        for i in range(settings.T5_SLOW_N):
            k = int(picks[i])
            nxt = Dot(one_screen(pts[i], extent), color=ROLE_COLOURS[k], radius=settings.T5_DOT_R)
            jump = Line(cur.get_center(), nxt.get_center(), color=MUTED, stroke_width=1)
            self.play(
                Indicate(legend[k], color=ROLE_COLOURS[k]), Create(jump), FadeIn(nxt),
                run_time=settings.FAST if i > 3 else settings.MID,
            )
            trail.add(jump, nxt)
            cur = nxt
        self.wait(0.5)

        self.play(Transform(cap, caption("thousands of dots later")))
        stages = []
        for n in settings.T5_STAGES:
            img = cloud(pts[:n], picks[:n], extent, single=settings.ACCENT_STRUCTURE)
            stages.append(img)
            self.play(FadeIn(img), run_time=settings.MID)
        self.play(FadeOut(trail))
        note = common.top_note("four simple moves, chosen at random, draw a fern")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class FernConverge(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        picks = picks_of(settings.T5_CONV_STAGES[-1], settings.T5_SEED)
        extents = [
            fern_extent(settings.T5_CONV_H, x * settings.T5_CONV_X, settings.T5_CONV_Y)
            for x in (-1, 0, 1)
        ]

        cap = caption("three different starts, one shape")
        frames = VGroup(*[
            Rectangle(width=e[1] - e[0] + settings.FRAME_PAD * 4,
                      height=e[3] - e[2] + settings.FRAME_PAD * 4,
                      color=MUTED, stroke_width=settings.STROKE_GRID).move_to(
                          [(e[0] + e[1]) / 2, (e[2] + e[3]) / 2, 0])
            for e in extents
        ])
        self.play(FadeIn(cap), Create(frames))

        starts = VGroup(*[
            Dot(one_screen(s, e), color=CORAL_C, radius=settings.T5_DOT_R)
            for s, e in zip(settings.T5_CONV_STARTS, extents)
        ])
        marks = VGroup(*[
            txt(f"start ({s[0]:g}, {s[1]:g})", (e[0] + e[1]) / 2,
                e[2] - settings.T5I_START_DY, settings.NAME_SCALE, CORAL_C)
            for s, e in zip(settings.T5_CONV_STARTS, extents)
        ])
        self.play(LaggedStart(*[FadeIn(d) for d in starts], lag_ratio=0.3), FadeIn(marks))
        seq = common.line_of(
            [("same moves:", MUTED)]
            + [(str(int(k) + 1), ROLE_COLOURS[int(k)]) for k in picks[:settings.T5I_SEQ_N]],
            0, settings.T5I_SEQ_Y, settings.NAME_SCALE, settings.T5I_SEQ_BUFF, False)
        seq.move_to([0, settings.T5I_SEQ_Y, 0])
        self.play(FadeIn(seq))
        self.wait(0.5)

        runs = [run_game(picks, s) for s in settings.T5_CONV_STARTS]
        for n in settings.T5_CONV_STAGES:
            imgs = [cloud(r[:n], picks[:n], e, single=settings.ACCENT_STRUCTURE)
                    for r, e in zip(runs, extents)]
            self.play(*[FadeIn(m) for m in imgs], run_time=settings.MID)
            self.wait(0.3)
        self.play(FadeOut(starts), FadeOut(marks), FadeOut(seq))
        note = common.top_note("where it began leaves no trace in the shape")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class FernRoles(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        extent = fern_extent(settings.T5_FERN_H, settings.T5_FERN_X, settings.T5_FERN_Y)
        picks = picks_of(settings.T5_STAGES[-1], settings.T5_SEED)
        pts = run_game(picks)

        cap = caption("each move draws one part")
        full = cloud(pts, picks, extent, single=settings.MUTED)
        self.play(FadeIn(cap), FadeIn(full))
        self.wait(0.5)
        coloured = cloud(pts, picks, extent)
        self.play(FadeIn(coloured), run_time=settings.MID)
        self.wait(0.5)

        labels = VGroup()
        for k, role in enumerate(settings.T5_ROLES):
            sel = picks == k
            only = cloud(pts[sel], picks[sel], extent)
            lbl = txt(role, settings.T5H_LBL_X, settings.T5H_LBL_Y - k * settings.T5H_LBL_DY,
                      settings.EQ_SCALE, ROLE_COLOURS[k])
            eq = map_eq(k, settings.T5H_EQ_Y, settings.T5A_EQ_SCALE, settings.T5H_EQ_X)
            share = txt(f"drew {int(sel.sum())} of {len(picks)} dots", settings.T5H_EQ_X,
                        settings.T5H_EQ_Y - settings.T5H_SHARE_DY, settings.NAME_SCALE,
                        ROLE_COLOURS[k])
            labels.add(lbl)
            self.play(FadeOut(coloured), FadeIn(only), FadeIn(lbl), FadeIn(eq), FadeIn(share),
                      run_time=settings.FAST)
            self.wait(settings.T5H_HOLD)
            self.play(FadeOut(only), FadeIn(coloured), FadeOut(eq), FadeOut(share),
                      run_time=settings.FAST)
        self.wait(0.5)

        frond = apply_map(pts, 1, settings.T5_ZOOM_ITER)
        pad = settings.T5_ZOOM_PAD
        bx0, bx1 = frond[:, 0].min() - pad, frond[:, 0].max() + pad
        by0, by1 = frond[:, 1].min() - pad, frond[:, 1].max() + pad
        self.play(*[FadeOut(m) for m in labels])
        inside = ((pts[:, 0] >= bx0) & (pts[:, 0] <= bx1)
                  & (pts[:, 1] >= by0) & (pts[:, 1] <= by1))
        src_lo = one_screen((bx0, by0), extent)
        src_hi = one_screen((bx1, by1), extent)
        src = Rectangle(width=src_hi[0] - src_lo[0], height=src_hi[1] - src_lo[1],
                        color=GOLD_C, stroke_width=settings.STROKE_GRID)
        src.move_to((src_lo + src_hi) / 2)
        zh = settings.T5_ZOOM_H
        zw = zh * (bx1 - bx0) / (by1 - by0)
        cx, cy = settings.T5_ZOOM_TARGET
        zext = (cx - zw / 2, cx + zw / 2, cy - zh / 2, cy + zh / 2)
        zscr = np.empty((int(inside.sum()), 2))
        zscr[:, 0] = zext[0] + (pts[inside, 0] - bx0) / (bx1 - bx0) * zw
        zscr[:, 1] = zext[2] + (pts[inside, 1] - by0) / (by1 - by0) * zh
        zcols = np.array([common.rgb(ROLE_COLOURS[k]) for k in picks[inside]], dtype=np.uint8)
        zimg = common.image_at(common.raster(zscr, zcols, zext), zext)
        zbox = Rectangle(width=zw, height=zh, color=GOLD_C, stroke_width=settings.STROKE_GRID)
        zbox.move_to([cx, cy, 0])
        self.play(Create(src))
        self.play(Create(zbox), FadeIn(zimg), run_time=settings.MID)
        note = common.top_note("one frond is the whole fern again, smaller")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def ring_pts(centre, radius, n=None):
    n = n if n is not None else settings.T5J_POLY_N
    return [(centre[0] + radius * np.cos(2 * np.pi * i / n),
             centre[1] + radius * np.sin(2 * np.pi * i / n)) for i in range(n)]


def square_pts(centre, half):
    return [(centre[0] - half, centre[1] - half), (centre[0] + half, centre[1] - half),
            (centre[0] + half, centre[1] + half), (centre[0] - half, centre[1] + half)]


def send_shape(piece, k):
    a, b, c, d, e, f = MAPS[k]
    return [(a * x + b * y + e, c * x + d * y + f) for x, y in piece]


def widest(pieces):
    out = 0.0
    for piece in pieces:
        arr = np.array(piece)[:, :2]
        gap = arr[:, None, :] - arr[None, :, :]
        out = max(out, float(np.hypot(gap[..., 0], gap[..., 1]).max()))
    return out


def shape_group(pieces, extent, colour):
    group = VGroup()
    for piece in pieces:
        poly_pts = [one_screen(p, extent) for p in piece]
        shape = Polygon(*poly_pts, color=colour, stroke_width=settings.STROKE_GRID)
        shape.set_fill(colour, opacity=settings.T5J_FILL)
        group.add(shape)
    return group


class FernAttractor(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        extent = fern_extent(settings.T5J_FERN_H, settings.T5G_PLANE_X,
                             settings.T5J_FERN_Y)
        picks = picks_of(settings.T5_STAGES[-1], settings.T5_SEED)
        pts = run_game(picks)

        cap = caption("start with any shape at all, anywhere")
        ghost = cloud(pts, picks, extent, single=settings.MUTED)
        self.play(FadeIn(cap))

        for index, (name, centre, size) in enumerate(settings.T5J_SHAPES):
            if index == 0:
                start = ring_pts(centre, size)
            else:
                start = square_pts(centre, size)
            pieces = [start]
            colour = ROLE_COLOURS[1] if index == 0 else GOLD_C
            group = shape_group(pieces, extent, colour)
            label = txt(name, settings.T5J_READ_X, settings.T5J_READ_Y,
                        settings.EQ_SCALE, colour)
            read = common.readout("widest piece:", f"{widest(pieces):.2f}",
                                  settings.T5J_READ_X,
                                  settings.T5J_READ_Y - settings.T5J_READ_DY, CORAL_C)
            count = common.readout("pieces:", "1", settings.T5J_READ_X,
                                   settings.T5J_READ_Y - 2 * settings.T5J_READ_DY, BLUE_C)
            self.play(FadeIn(group), FadeIn(label), FadeIn(read), FadeIn(count),
                      run_time=settings.MID)
            self.wait(settings.T5J_HOLD)
            if index == 0:
                self.play(Transform(cap, caption(
                    "put it through all four moves, then do that again")))
            for step in range(settings.T5J_PASSES):
                pieces = [send_shape(piece, k) for piece in pieces for k in range(len(MAPS))]
                fresh = shape_group(pieces, extent, colour)
                self.play(
                    ReplacementTransform(group, fresh),
                    Transform(read[1], common.value_like(read, f"{widest(pieces):.2f}",
                                                         CORAL_C)),
                    Transform(count[1], common.value_like(count, f"{len(pieces)}", BLUE_C)),
                    run_time=settings.SLOW if step == 0 else settings.MID,
                )
                group = fresh
                self.wait(0.4)
            self.wait(settings.T5J_HOLD)
            if index == 0:
                self.play(FadeIn(ghost), run_time=settings.MID)
                self.play(Transform(cap, caption("and again, from something else entirely")))
            self.play(FadeOut(group), FadeOut(label), FadeOut(read), FadeOut(count),
                      run_time=settings.FAST)

        table = VGroup()
        for k in range(len(MAPS)):
            m = np.array([[MAPS[k][0], MAPS[k][1]], [MAPS[k][2], MAPS[k][3]]])
            stretch = float(np.linalg.svd(m, compute_uv=False)[0])
            table.add(txt(f"move {k + 1} shrinks by {stretch:.3f}", settings.T5J_READ_X + 1.2,
                          settings.T5J_READ_Y - k * settings.T5G_TAB_DY, settings.EQ_SCALE,
                          ROLE_COLOURS[k]))
        self.play(Transform(cap, caption("every move shrinks whatever it is given")),
                  LaggedStart(*[FadeIn(m) for m in table], lag_ratio=0.3),
                  run_time=settings.MID)
        every = txt("every one of them is below 1", settings.T5J_READ_X + 1.2,
                    settings.T5J_READ_Y - len(MAPS) * settings.T5G_TAB_DY - 0.15,
                    settings.NAME_SCALE, GREEN_C)
        self.play(FadeIn(every))
        self.wait(settings.T5J_HOLD)

        bright = cloud(pts, picks, extent, single=settings.ACCENT_STRUCTURE)
        self.play(FadeIn(bright), FadeOut(ghost))
        note = common.top_note("whatever it starts from, it is pulled onto this one shape")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1.2)


def table_row(size, count, row):
    t = txt(f"{size:.2f} → {count}", settings.T5_TABLE_X,
            settings.T5_TABLE_Y - row * settings.T5_TABLE_DY, settings.EQ_SCALE, MUTED,
            [(0, 4, GOLD_C), (5, 40, BLUE_C)])
    return t


def cell_image(cells, size, extent, base=(0.0, 0.0)):
    nx0, nx1, ny0, ny1 = settings.T5_NATIVE
    w = max(2, int((extent[1] - extent[0]) * settings.RASTER_PPU))
    h = max(2, int((extent[3] - extent[2]) * settings.RASTER_PPU))
    arr = np.zeros((h, w, 4), dtype=np.uint8)
    arr[..., :3] = common.rgb(settings.ACCENT_MATH)
    px = w / (nx1 - nx0)
    py = h / (ny1 - ny0)
    for cx, cy in cells:
        x0 = int((base[0] + cx * size - nx0) * px)
        x1 = int((base[0] + (cx + 1) * size - nx0) * px)
        y1 = int((ny1 - (base[1] + cy * size)) * py)
        y0 = int((ny1 - (base[1] + (cy + 1) * size)) * py)
        x0, x1 = max(0, x0), min(w, x1)
        y0, y1 = max(0, y0), min(h, y1)
        if x1 > x0 and y1 > y0:
            arr[y0:y1, x0:x1, 3] = settings.T5F_CELL_ALPHA
    return common.image_at(arr, extent)


def grid_lines(extent, size):
    nx0, nx1, ny0, ny1 = settings.T5_NATIVE
    g = VGroup()
    k = int(np.ceil((nx1 - nx0) / size)) + 1
    for i in range(k):
        gx = np.floor(nx0 / size) * size + i * size
        a = one_screen((gx, ny0), extent)
        b = one_screen((gx, ny1), extent)
        g.add(Line(a, b, color=MUTED, stroke_width=1))
    m = int(np.ceil((ny1 - ny0) / size)) + 1
    for j in range(m):
        gy = np.floor(ny0 / size) * size + j * size
        a = one_screen((nx0, gy), extent)
        b = one_screen((nx1, gy), extent)
        g.add(Line(a, b, color=MUTED, stroke_width=1))
    return g


def anchor_of(pts):
    return np.asarray(pts).min(axis=0)


def occupied(pts, size):
    flat = np.asarray(pts)
    anchored = flat - flat.min(axis=0)
    return np.unique(np.floor(anchored / size).astype(np.int64), axis=0)


class FernDim(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        extent = fern_extent(settings.T5_DIM_H, settings.T5_DIM_X, settings.T5_DIM_Y)
        picks = picks_of(settings.T5_STAGES[-1], settings.T5_SEED)
        pts = run_game(picks)
        nx0, nx1, ny0, ny1 = settings.T5_NATIVE
        unit = (extent[1] - extent[0]) / (nx1 - nx0)

        cap = caption("count the boxes the fern touches")
        img = cloud(pts, picks, extent, single=settings.ACCENT_STRUCTURE)
        head = txt("box → boxes hit", settings.T5_TABLE_X,
                   settings.T5_TABLE_Y + settings.T5_TABLE_DY, settings.EQ_SCALE, MUTED)
        self.play(FadeIn(cap), FadeIn(img), FadeIn(head))

        sizes = settings.T5_BOX_SIZES
        counts = []
        rows = []
        grid = None
        for i, size in enumerate(sizes):
            cells = occupied(pts, size)
            base = anchor_of(pts)
            counts.append(len(cells))
            row = table_row(size, len(cells), i)
            rows.append(row)
            if len(cells) <= settings.T5F_CELL_LIMIT:
                shaded = VGroup()
                for cx, cy in cells:
                    sq = Square(side_length=size * unit, stroke_width=settings.STROKE_GRID,
                                color=GOLD_C)
                    sq.set_fill(GOLD_C, opacity=settings.T5_CELL_FILL)
                    sq.move_to(one_screen((base[0] + (cx + 0.5) * size, base[1] + (cy + 0.5) * size),
                                          extent))
                    shaded.add(sq)
                block = VGroup(grid_lines(extent, size), shaded)
            else:
                block = cell_image(cells, size, extent, base)
            if grid is None:
                self.play(FadeIn(block), run_time=settings.MID)
            else:
                self.play(FadeOut(grid), FadeIn(block), run_time=settings.MID)
            grid = block
            self.bring_to_front(img)
            self.play(FadeIn(row), run_time=settings.FAST)
            self.wait(settings.T5F_HOLD)
        self.play(FadeOut(grid))
        self.wait(0.5)

        plot = common.LogLog(settings.T5_PLOT_X, settings.T5_PLOT_Y,
                             xlabel="box size", ylabel="boxes hit")
        slope, inter = plot.fit(sizes, counts)
        d = -slope
        axes = plot.build()
        self.play(Create(axes))
        dots = plot.dots(sizes, counts, GOLD_C)
        self.play(LaggedStart(*[TransformFromCopy(r, dt) for r, dt in zip(rows, dots)],
                              lag_ratio=0.2), run_time=settings.SLOW)
        fit = plot.fit_line(sizes, slope, inter, GREEN_C)
        self.play(Create(fit))
        rel = txt("d = log boxes / log (1/box)", settings.T5_REL_X, settings.T5F_REL_Y,
                  settings.EQ_SCALE, MUTED, [(0, 1, GREEN_C), (5, 10, BLUE_C), (14, 21, GOLD_C)])
        value = txt(f"d ≈ {d:.3f}", settings.T5_REL_X, settings.T5F_REL_Y - settings.T5F_REL_DY,
                    settings.FORMULA_SCALE, GREEN_C)
        self.play(FadeIn(rel))
        self.play(TransformFromCopy(fit, value))
        self.wait(0.5)

        self.play(
            FadeOut(head), *[FadeOut(r) for r in rows], FadeOut(img), FadeOut(cap),
            FadeOut(axes), FadeOut(dots), FadeOut(fit), FadeOut(rel),
            value.animate.move_to([0, settings.T5_VAL_Y, 0]),
        )
        sc = common.Scale1to2()
        self.play(Create(sc.build()))
        marks = VGroup(
            sc.mark(1.0, "straight line", MUTED, True),
            sc.mark(settings.T4_COAST_D, "measured coast", BLUE_C, False),
            sc.mark(float(np.log(4) / np.log(3)), "Koch curve", BLUE_C, True),
            sc.mark(d, "fern", GREEN_C, True),
            sc.mark(2.0, "filled square", MUTED, True),
        )
        self.play(LaggedStart(*[FadeIn(m) for m in marks], lag_ratio=0.25), run_time=settings.SLOW)
        note = common.top_note("simple rules, repeated, land between the whole numbers")
        self.play(FadeIn(note))
        self.wait(1)
