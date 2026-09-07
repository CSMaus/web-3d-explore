import numpy as np
from manim import (
    Scene, Arrow, Circle, Dot, Line, Rectangle, Square, VGroup, ValueTracker,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, MoveAlongPath, Transform,
    always_redraw,
)

import settings
import common
import growth
import topic05
import topic06
from common import BLUE_C, GOLD_C, GREEN_C, CORAL_C, MUTED, caption, poly, txt


def grid_box(rows, cols, height, centre):
    pitch = height / rows
    w = pitch * cols
    box = (centre[0] - w / 2, centre[0] + w / 2, centre[1] - height / 2, centre[1] + height / 2)
    return box, pitch


def cell_at(r, c, box, pitch):
    return np.array([box[0] + (c + 0.5) * pitch, box[3] - (r + 0.5) * pitch, 0])


def cell_sq(r, c, box, pitch, colour=BLUE_C, fill=None):
    sq = Square(side_length=pitch, stroke_width=0)
    sq.set_fill(colour, opacity=fill if fill is not None else settings.T7_FILL)
    sq.move_to(cell_at(r, c, box, pitch))
    return sq


def cells_group(order, box, pitch, colour=BLUE_C):
    return VGroup(*[cell_sq(r, c, box, pitch, colour) for r, c in order])


def dla_fit(order, size, height, centre):
    half = size // 2
    rmax = int(np.abs(np.asarray(order) - half).max()) + 2
    box, pitch = grid_box(2 * rmax + 1, 2 * rmax + 1, height, centre)
    return box, pitch, np.asarray(order) - (half - rmax)


def field_image(phi, box):
    ey = np.zeros_like(phi)
    ex = np.zeros_like(phi)
    ey[1:-1, :] = phi[2:, :] - phi[:-2, :]
    ex[:, 1:-1] = phi[:, 2:] - phi[:, :-2]
    mag = np.hypot(ex, ey)
    base = float(np.median(mag))
    peak = float(mag.max())
    span = max(peak - base, 1e-9)
    lift = np.clip((mag - base) / span, 0, 1) ** settings.T7_FIELD_GAMMA
    arr = np.zeros((phi.shape[0], phi.shape[1], 4), dtype=np.uint8)
    arr[..., :3] = common.rgb(settings.ACCENT_MATH)
    arr[..., 3] = (lift * settings.T7_FIELD_ALPHA).astype(np.uint8)
    return common.image_at(arr, box)


def plates(box, pitch):
    top = Rectangle(width=box[1] - box[0], height=settings.T7_PLATE_H, stroke_width=0)
    top.set_fill(GOLD_C, opacity=1)
    top.move_to([(box[0] + box[1]) / 2, box[3] + settings.T7_PLATE_H / 2 - pitch, 0])
    bottom = top.copy()
    bottom.move_to([(box[0] + box[1]) / 2, box[2] - settings.T7_PLATE_H / 2 + pitch, 0])
    return VGroup(top, bottom)


def grow_in_chunks(scene, order, box, pitch, start, chunk, run_time):
    made = VGroup()
    for i in range(start, len(order), chunk):
        part = cells_group(order[i:i + chunk], box, pitch)
        made.add(part)
        scene.play(FadeIn(part), run_time=run_time)
    return made


class Discharge(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        rows, cols = settings.T7_DIS_ROWS, settings.T7_DIS_COLS
        box, pitch = grid_box(rows, cols, settings.T7_H, (settings.T7_X, settings.T7_Y))
        cluster, order, phi = growth.dbm(rows, cols, settings.T7_ETA, settings.T7_SEED)

        cap = caption("a discharge crossing a gap")
        bars = plates(box, pitch)
        self.play(FadeIn(cap), Create(bars))
        self.wait(0.5)

        tree = grow_in_chunks(self, order, box, pitch, 0, settings.T7_DIS_CHUNK, settings.FAST)
        self.play(Indicate(tree, color=BLUE_C), run_time=settings.MID)
        self.wait(0.3)

        self.play(Transform(cap, caption("not one line, but a tree of channels")))
        anchor = cell_at(*order[len(order) // 3], box, pitch)
        half = settings.T7_ZOOM_HALF
        picked = [(r, c) for r, c in order
                  if abs(cell_at(r, c, box, pitch)[0] - anchor[0]) <= half
                  and abs(cell_at(r, c, box, pitch)[1] - anchor[1]) <= half]
        k = settings.T7_ZOOM_SIZE / (2 * half)
        target = np.array([settings.T7_ZOOM_T[0], settings.T7_ZOOM_T[1], 0])
        inset = VGroup()
        for r, c in picked:
            sq = Square(side_length=pitch * k, stroke_width=0)
            sq.set_fill(BLUE_C, opacity=settings.T7_FILL)
            sq.move_to(target + (cell_at(r, c, box, pitch) - anchor) * k)
            inset.add(sq)
        src = Rectangle(width=2 * half, height=2 * half, color=MUTED,
                        stroke_width=settings.STROKE_GRID).move_to(anchor)
        dst = Rectangle(width=settings.T7_ZOOM_SIZE, height=settings.T7_ZOOM_SIZE, color=MUTED,
                        stroke_width=settings.STROKE_GRID).move_to(target)
        self.play(Create(src))
        self.play(Create(dst), FadeIn(inset), run_time=settings.MID)
        note = common.top_note("every split carries smaller splits")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class BreakdownModel(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        rows, cols = settings.T7_ROWS, settings.T7_COLS
        box, pitch = grid_box(rows, cols, settings.T7_H, (settings.T7_X, settings.T7_Y))
        cluster, order, phi = growth.dbm(rows, cols, settings.T7_ETA, settings.T7_SEED)

        cap = caption("the field decides where the next site lights up")
        bars = plates(box, pitch)
        seed = cells_group(order[:1], box, pitch)
        self.play(FadeIn(cap), Create(bars), FadeIn(seed))
        glow = field_image(growth.field(rows, cols, growth.mask_of(rows, cols, order, 1)), box)
        self.play(FadeIn(glow), run_time=settings.MID)
        self.bring_to_front(seed)
        rule = txt("chance of lighting up  ∝  field strength", 0, settings.T7_RULE_Y,
                   settings.EQ_SCALE, MUTED, [(18, 40, GOLD_C)])
        self.play(FadeIn(rule))
        self.wait(0.5)

        made = VGroup(seed)
        for step, (r, c) in enumerate(order[1:settings.T7_SLOW_N], start=2):
            one = cell_sq(r, c, box, pitch)
            made.add(one)
            fresh = field_image(
                growth.field(rows, cols, growth.mask_of(rows, cols, order, step)), box)
            self.play(FadeOut(glow), FadeIn(fresh), FadeIn(one), run_time=settings.FAST)
            glow = fresh
            self.bring_to_front(made)
        self.play(Transform(cap, caption("the same choice, made hundreds of times")))
        grow_in_chunks(self, order, box, pitch, settings.T7_SLOW_N, settings.T7_CHUNK,
                       settings.FAST)
        name = txt(settings.T7_DBM_NAME, 0, settings.T7_RULE_Y, settings.NAME_SCALE, MUTED)
        self.play(FadeOut(rule))
        self.play(FadeIn(name))
        note = common.top_note("a biased coin, not a fixed rule")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def four_ways(x, y, length, out):
    g = VGroup()
    centre = np.array([x, y, 0])
    g.add(Dot(centre, color=CORAL_C, radius=settings.T7_DOT_R))
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        tip = centre + np.array([dx * length, dy * length, 0])
        g.add(Arrow(centre, tip, color=MUTED, buff=0, stroke_width=settings.STROKE_GRID))
        lbl = centre + np.array([dx * out, dy * out, 0])
        g.add(txt("1/4", lbl[0], lbl[1], settings.NAME_SCALE, GOLD_C))
    return g


class Aggregation(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        size = settings.T7_DLA_SIZE
        grid, raw, tracks = growth.dla(size, settings.T7_DLA_N, settings.T7_SEED,
                                       trace_first=settings.T7_WALK_SHOWN)
        box, pitch, order = dla_fit(raw, size, settings.T7_DLA_H,
                                    (settings.T7_DLA_X, settings.T7_DLA_Y))
        half = size // 2
        dist = np.hypot(raw[:, 0] - half, raw[:, 1] - half)

        cap = caption("one seed, and particles wandering in")
        name = txt(settings.T7_DLA_NAME, settings.T7A_NAME_X, settings.T7A_NAME_Y,
                   settings.NAME_SCALE, MUTED)
        reach = max(int(np.abs(np.concatenate(tracks) - half).max()) + 2,
                    settings.T7_EARLY_MIN)
        ebox, epitch = grid_box(2 * reach + 1, 2 * reach + 1, settings.T7_DLA_H,
                                (settings.T7_DLA_X, settings.T7_DLA_Y))
        eshift = half - reach
        seed = cells_group([(half - eshift, half - eshift)], ebox, epitch)
        early = [seed]
        self.play(FadeIn(cap), FadeIn(name), FadeIn(seed))

        four = four_ways(settings.T7A_FOUR_X, settings.T7A_FOUR_Y, settings.T7A_FOUR_LEN,
                         settings.T7A_FOUR_LBL)
        lines = VGroup(*[
            txt(body, settings.T7A_FOUR_X, settings.T7A_RULE_Y - i * settings.T7A_RULE_DY,
                settings.EQ_SCALE, colour)
            for i, (body, colour) in enumerate((("one step, four neighbours", MUTED),
                                                ("each with chance 1/4", GOLD_C),
                                                ("stops on first touch", GREEN_C)))
        ])
        self.play(Create(four), run_time=settings.MID)
        for one in lines:
            self.play(FadeIn(one), run_time=settings.FAST)
        self.wait(0.5)
        self.play(FadeOut(four), FadeOut(lines))

        stuck_read = common.readout("stuck so far:", "1", settings.T7A_COUNT_X,
                                    settings.T7A_COUNT_Y, GREEN_C)
        self.play(FadeIn(stuck_read))
        for j, track in enumerate(tracks):
            walk = [cell_at(r - eshift, c - eshift, ebox, epitch) for r, c in track]
            path = poly(walk, MUTED, settings.T7_WALK_WIDTH)
            dot = Dot(walk[0], color=CORAL_C, radius=settings.T7_DOT_R)
            steps_read = common.readout("steps taken:", f"{len(track)}", settings.T7A_COUNT_X,
                                        settings.T7A_COUNT_Y - settings.T7A_COUNT_DY, CORAL_C)
            self.play(FadeIn(dot), FadeIn(steps_read), run_time=settings.FAST)
            self.play(Create(path), MoveAlongPath(dot, path), run_time=settings.SLOW)
            stuck = cell_sq(raw[1 + j][0] - eshift, raw[1 + j][1] - eshift, ebox, epitch)
            self.play(FadeOut(path), FadeOut(dot), FadeIn(stuck), FadeOut(steps_read),
                      Transform(stuck_read[1],
                                common.value_like(stuck_read, f"{2 + j}", GREEN_C)),
                      run_time=settings.FAST)
            early.append(stuck)

        self.play(Transform(cap, caption("the same wander, repeated a thousand times")),
                  FadeOut(stuck_read), *[FadeOut(m) for m in early])
        start = 1 + len(tracks)
        self.play(FadeIn(cells_group(order[:start], box, pitch)), run_time=settings.FAST)
        n_read = common.readout("particles:", f"{start}", settings.T7A_COUNT_X,
                                settings.T7A_COUNT_Y, BLUE_C)
        r_read = common.readout("reach in cells:", f"{dist[:start].max():.0f}",
                                settings.T7A_COUNT_X,
                                settings.T7A_COUNT_Y - settings.T7A_COUNT_DY, GOLD_C)
        self.play(FadeIn(n_read), FadeIn(r_read))
        step = max(1, (len(order) - start) // settings.T7A_GROW_CHUNKS)
        for i in range(start, len(order), step):
            part = cells_group(order[i:i + step], box, pitch)
            got = min(i + step, len(order))
            self.play(
                FadeIn(part),
                Transform(n_read[1], common.value_like(n_read, f"{got}", BLUE_C)),
                Transform(r_read[1],
                          common.value_like(r_read, f"{dist[:got].max():.0f}", GOLD_C)),
                run_time=settings.FAST)
        self.wait(0.4)

        self.play(Transform(cap, caption("count the particles within a distance r of the seed")),
                  FadeOut(n_read), FadeOut(r_read))
        centre = cell_at(order[0][0], order[0][1], box, pitch)
        radii = list(settings.T7_MASS_RADII)
        counts = []
        rows = VGroup()
        for k, r in enumerate(radii):
            sel = [tuple(o) for o, dd in zip(order, dist) if dd <= r]
            counts.append(len(sel))
            ring = Circle(radius=r * pitch, arc_center=centre, color=GOLD_C,
                          stroke_width=settings.T7A_RING_WIDTH)
            hot = cells_group(sel, box, pitch, GOLD_C)
            row = txt(f"r = {r}     N = {len(sel)}", settings.T7A_TABLE_X + 1.5,
                      settings.T7A_TABLE_Y - k * settings.T7A_TABLE_DY,
                      settings.EQ_SCALE, GOLD_C)
            rows.add(row)
            self.play(Create(ring), run_time=settings.FAST)
            self.play(FadeIn(hot), FadeIn(row), run_time=settings.FAST)
            self.play(FadeOut(hot), run_time=settings.FAST)
        self.wait(0.3)

        eq1 = txt("N(r) = k · rᵈ", settings.T7A_EQ_X, settings.T7A_EQ_Y,
                  settings.FORMULA_SCALE, common.INK,
                  [(0, 1, GOLD_C), (2, 3, GOLD_C), (10, 11, GOLD_C), (11, 12, GREEN_C)])
        eq2 = txt("log N = d · log r + log k", settings.T7A_EQ_X,
                  settings.T7A_EQ_Y - settings.T7A_EQ_DY, settings.EQ_SCALE, MUTED,
                  [(3, 4, GOLD_C), (5, 6, GREEN_C), (11, 12, GOLD_C)])
        self.play(FadeIn(eq1))
        self.play(FadeIn(eq2))
        self.wait(0.4)

        self.play(Transform(cap, caption("the five counts on a log-log plot")), FadeOut(rows))
        plot = common.LogLog(settings.T7A_PLOT_X, settings.T7A_PLOT_Y,
                             xlabel="distance r", ylabel="particles N")
        slope, inter = plot.fit(radii, counts)
        self.play(Create(plot.build()))
        self.play(LaggedStart(*[FadeIn(d) for d in plot.dots(radii, counts)], lag_ratio=0.35),
                  run_time=settings.MID)
        self.play(Create(plot.fit_line(radii, slope, inter)), run_time=settings.MID)
        got = txt(f"d = {slope:.3f}", settings.T7A_EQ_X, settings.T7A_EQ_Y,
                  settings.FORMULA_SCALE, GREEN_C)
        self.play(Transform(eq1, got), Indicate(eq2[5], color=GREEN_C))
        known = txt(settings.T7A_ACCEPTED, settings.T7A_EQ_X,
                    settings.T7A_EQ_Y - settings.T7A_EQ_DY, settings.NAME_SCALE, MUTED)
        self.play(Transform(eq2, known))
        note = common.top_note("wandering in at random builds the same branching")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class PhysicalFaces(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        rows = settings.T7_FACE_ROWS
        cols = settings.T7_FACE_COLS
        runs = []
        for i in range(3):
            box, pitch = grid_box(rows, cols, settings.T7_PANEL_H,
                                  ((i - 1) * settings.T7_PANEL_DX, settings.T7_PANEL_Y))
            grid, raw = growth.dla(cols, settings.T7_FACE_N, settings.T7_SEED + 17 * i)
            box, pitch, order = dla_fit(raw, cols, settings.T7_PANEL_H,
                                        ((i - 1) * settings.T7_PANEL_DX, settings.T7_PANEL_Y))
            runs.append((box, pitch, order))

        cap = caption("one growth rule, three different media")
        frames = VGroup(*[
            Rectangle(width=box[1] - box[0], height=box[3] - box[2], color=MUTED,
                      stroke_width=settings.STROKE_GRID).move_to(
                          [(box[0] + box[1]) / 2, (box[2] + box[3]) / 2, 0])
            for box, pitch, order in runs
        ])
        labels = VGroup(*[
            txt(name, (i - 1) * settings.T7_PANEL_DX,
                settings.T7_PANEL_Y - settings.T7_PANEL_LBL_DY, settings.NAME_SCALE, BLUE_C)
            for i, name in enumerate(settings.T7_FACE_LABELS)
        ])
        notes = VGroup(*[
            txt(body, (i - 1) * settings.T7_PANEL_DX,
                settings.T7_PANEL_Y - settings.T7_PANEL_LBL_DY - settings.T7_FACE_NOTE_DY,
                settings.NAME_SCALE, MUTED)
            for i, body in enumerate(settings.T7_FACE_NOTES)
        ])
        self.play(FadeIn(cap), Create(frames), FadeIn(labels))
        self.play(FadeIn(notes), run_time=settings.FAST)
        self.wait(0.3)

        made = [VGroup() for _ in runs]
        chunk = settings.T7_FACE_CHUNK
        for start in range(0, settings.T7_FACE_N, chunk):
            anims = []
            for slot, (box, pitch, order) in enumerate(runs):
                part = cells_group(order[start:start + chunk], box, pitch)
                made[slot].add(part)
                anims.append(FadeIn(part))
            self.play(*anims, run_time=settings.FAST)
        extra = txt(settings.T7_SNOW_NOTE, 0, settings.T7_SNOW_Y, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(extra))
        note = common.top_note("the same fractal in glass, in metal, in rock")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def carved(i, j, k, n, gap):
    for a, b, c in ((i, j, k), (j, i, k), (k, i, j)):
        if max(abs(b), abs(c)) <= abs(a) - gap:
            return True
    return False


def hopper_cells(n, gap):
    kept = [(i, j, k)
            for i in range(-n, n + 1) for j in range(-n, n + 1) for k in range(-n, n + 1)
            if not carved(i, j, k, n, gap)]
    inside = set(kept)
    steps = ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))
    return [c for c in kept
            if any((c[0] + d[0], c[1] + d[1], c[2] + d[2]) not in inside for d in steps)]


def body(cells, n, size, ty, at):
    step = size / (2 * n + 1)
    centres = [np.array(c, dtype=float) * step for c in cells]
    return common.solid(centres, step * settings.T6_MENGER_FILL, settings.TILT_X, ty, at)


class CrystalBridge(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        cap = caption("both of these grew by adding one particle at a time")
        _, dend_raw = growth.dla(settings.T7B_DEND_COLS, settings.T7B_DEND_N, settings.T7_SEED)
        dbox, dpitch, dend = dla_fit(dend_raw, settings.T7B_DEND_COLS, settings.T7B_PAIR_H,
                                     (-settings.T7B_PAIR_DX, settings.T7B_PAIR_Y))
        dendrite = cells_group(dend, dbox, dpitch)
        block = common.solid([np.zeros(3)], settings.T7B_PAIR_H * 0.7, settings.TILT_X,
                             settings.TILT_Y, (settings.T7B_PAIR_DX, settings.T7B_PAIR_Y))
        lbl_a = txt("branched all the way down", -settings.T7B_PAIR_DX,
                    settings.T7B_PAIR_Y - settings.T7B_PAIR_LBL_DY, settings.EQ_SCALE, CORAL_C)
        lbl_b = txt("flat faces, no branches", settings.T7B_PAIR_DX,
                    settings.T7B_PAIR_Y - settings.T7B_PAIR_LBL_DY, settings.EQ_SCALE, GREEN_C)
        self.play(FadeIn(cap))
        self.play(FadeIn(dendrite), FadeIn(lbl_a), run_time=settings.MID)
        self.play(FadeIn(block), FadeIn(lbl_b), run_time=settings.MID)
        ask = txt("one growth process, two outcomes - what decides?", 0, settings.T7B_RULE_Y,
                  settings.EQ_SCALE, MUTED)
        self.play(FadeIn(ask))
        self.wait(0.8)
        self.play(FadeOut(VGroup(dendrite, block, lbl_a, lbl_b, ask)))

        self.play(Transform(cap, caption("supply has to reach the surface before it can stick")))
        size = settings.T7B_FIELD_SIZE
        mask, phi, corner, face = growth.square_field(size, settings.T7B_FIELD_SIDE,
                                                      settings.T7B_FIELD_SWEEPS)
        fbox, fpitch = grid_box(size, size, settings.T7B_FIELD_H,
                                (settings.T7B_FIELD_X, settings.T7B_FIELD_Y))
        seedblock = Square(side_length=settings.T7B_FIELD_SIDE * fpitch, stroke_width=0)
        seedblock.set_fill(BLUE_C, opacity=1)
        seedblock.move_to([settings.T7B_FIELD_X, settings.T7B_FIELD_Y, 0])
        glow = field_image(phi, fbox)
        self.play(FadeIn(seedblock))
        self.play(FadeIn(glow), run_time=settings.MID)
        self.bring_to_front(seedblock)
        grown = txt("a crystal, seen from above", settings.T7B_FIELD_X,
                    settings.T7B_FIELD_Y - settings.T7B_FIELD_H / 2 - 0.4,
                    settings.NAME_SCALE, MUTED)
        self.play(FadeIn(grown))
        self.wait(0.4)

        c_pt = cell_at(corner[0], corner[1], fbox, fpitch)
        f_pt = cell_at(face[0], face[1], fbox, fpitch)
        c_dot = Dot(c_pt, color=CORAL_C, radius=settings.T7B_MARK_R)
        f_dot = Dot(f_pt, color=GREEN_C, radius=settings.T7B_MARK_R)
        c_read = common.readout("supply at a corner:", f"{phi[corner]:.3f}",
                                settings.T7B_READ_X, settings.T7B_READ_Y, CORAL_C)
        f_read = common.readout("supply at a face:", f"{phi[face]:.3f}",
                                settings.T7B_READ_X,
                                settings.T7B_READ_Y - settings.T7B_READ_DY, GREEN_C)
        self.play(FadeIn(c_dot), FadeIn(c_read))
        self.play(FadeIn(f_dot), FadeIn(f_read))
        ratio = txt(f"a corner gets {phi[corner] / phi[face]:.2f} times as much",
                    settings.T7B_READ_X + 1.9,
                    settings.T7B_READ_Y - 2 * settings.T7B_READ_DY,
                    settings.EQ_SCALE, GOLD_C)
        self.play(FadeIn(ratio), Indicate(VGroup(c_dot, f_dot), color=GOLD_C))
        rule = txt("growth speed  ∝  supply reaching the surface", 0, settings.T7B_RULE_Y,
                   settings.EQ_SCALE, MUTED, [(13, 40, GOLD_C)])
        self.play(FadeIn(rule))
        self.wait(0.8)
        self.play(FadeOut(VGroup(seedblock, c_dot, f_dot, c_read, f_read, ratio, grown, rule)),
                  FadeOut(glow))

        self.play(Transform(cap, caption("let the corners run ahead and the faces stay behind")))
        n = settings.T7_HOP_N
        hsize = settings.T7B_HOP_SIZE
        at = (settings.T7B_HOP_X, settings.T7B_HOP_Y)
        cells = hopper_cells(n, settings.T7_HOP_T)
        spin = ValueTracker(settings.TILT_Y)
        first = body(cells, n, hsize, spin.get_value(), at)
        self.play(FadeIn(first))
        self.remove(first)
        shape = always_redraw(lambda: body(cells, n, hsize, spin.get_value(), at))
        self.add(shape)
        hop_name = txt("hopper crystal", settings.T7B_HOP_LBL_X, settings.T7B_READ_Y,
                       settings.FORMULA_SCALE, BLUE_C)
        hop_why = txt("edges ahead, faces hollow", settings.T7B_HOP_LBL_X,
                      settings.T7B_READ_Y - settings.T7B_READ_DY, settings.EQ_SCALE, MUTED)
        hop_real = txt(settings.T7B_REAL, settings.T7B_HOP_LBL_X,
                       settings.T7B_READ_Y - 2 * settings.T7B_READ_DY,
                       settings.NAME_SCALE, MUTED)
        self.play(FadeIn(hop_name))
        self.play(FadeIn(hop_why))
        self.play(spin.animate.set_value(spin.get_value() + settings.T7B_HOP_SPIN),
                  run_time=settings.SLOW)
        self.play(FadeIn(hop_real))
        self.wait(0.5)
        self.remove(shape)
        held = body(cells, n, hsize, spin.get_value(), at)
        self.add(held)
        self.play(FadeOut(held), FadeOut(hop_name), FadeOut(hop_why), FadeOut(hop_real))

        self.play(Transform(cap, caption("which end it lands on is set by how fast supply arrives")))
        axis = Line([-settings.T7B_AXIS_LEN / 2, settings.T7B_AXIS_Y, 0],
                    [settings.T7B_AXIS_LEN / 2, settings.T7B_AXIS_Y, 0],
                    color=common.INK, stroke_width=settings.STROKE_GRID)
        ends = VGroup(
            txt("ordered", -settings.T7B_AXIS_LEN / 2, settings.T7B_AXIS_Y - 0.42,
                settings.NAME_SCALE, MUTED),
            txt("fractal", settings.T7B_AXIS_LEN / 2, settings.T7B_AXIS_Y - 0.42,
                settings.NAME_SCALE, MUTED))
        self.play(Create(axis), FadeIn(ends))
        marker = Dot([settings.T7B_SLOT_X[0], settings.T7B_AXIS_Y, 0], color=GOLD_C,
                     radius=settings.SCALE_DOT_R)

        flat = common.solid([np.zeros(3)], settings.T7B_SLOT_H * 0.72, settings.TILT_X,
                            settings.TILT_Y, (settings.T7B_SLOT_X[0], settings.T7B_SLOT_Y))
        hop = body(cells, n, settings.T7B_SLOT_H, settings.TILT_Y,
                   (settings.T7B_SLOT_X[1], settings.T7B_SLOT_Y))
        sbox, spitch, sdend = dla_fit(dend_raw, settings.T7B_DEND_COLS, settings.T7B_SLOT_H,
                                      (settings.T7B_SLOT_X[2], settings.T7B_SLOT_Y))
        dend_small = cells_group(sdend, sbox, spitch)
        shapes = (flat, hop, dend_small)
        for i, shape_i in enumerate(shapes):
            name = txt(settings.T7B_NAMES[i], settings.T7B_SLOT_X[i],
                       settings.T7B_SLOT_Y - settings.T7B_SLOT_LBL_DY,
                       settings.EQ_SCALE, BLUE_C)
            why = txt(settings.T7B_WHY[i], settings.T7B_SLOT_X[i],
                      settings.T7B_SLOT_Y - settings.T7B_SLOT_WHY_DY,
                      settings.NAME_SCALE, MUTED)
            if i == 0:
                self.play(FadeIn(shape_i), FadeIn(name), FadeIn(why), FadeIn(marker),
                          run_time=settings.MID)
            else:
                self.play(FadeIn(shape_i), FadeIn(name), FadeIn(why),
                          marker.animate.move_to([settings.T7B_SLOT_X[i], settings.T7B_AXIS_Y, 0]),
                          run_time=settings.MID)
            self.wait(0.4)
        note = common.top_note("the fractal is in the growth, not in the finished crystal")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class TwoContrasts(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        rows = settings.T7_FACE_ROWS
        cols = settings.T7_FACE_COLS

        cap = caption("a fixed rule and a random rule, the same look")
        word = topic06.expand(settings.T6_PLANT_SEED, dict(settings.T6_PLANT_RULES),
                              settings.T7_PLANT_PASSES)
        segs = topic06.fit_segs(
            topic06.turtle(word, settings.T6_PLANT_ANGLE * common.DEGREES, 1.0, (0, 0), np.pi / 2),
            settings.T7_PAIR_H, (-settings.T7_PAIR_DX, settings.T7_PAIR_Y))
        plant = topic06.segs_group(segs, BLUE_C, settings.STROKE_GRID)
        box, pitch = grid_box(settings.T7_BOLT_ROWS, settings.T7_BOLT_COLS,
                              settings.T7_PAIR_H, (settings.T7_PAIR_DX, settings.T7_PAIR_Y))
        _, bolt_order, _ = growth.dbm(settings.T7_BOLT_ROWS, settings.T7_BOLT_COLS,
                                      settings.T7_ETA, settings.T7_SEED)
        bolt = cells_group(bolt_order, box, pitch)
        lbl_a = txt("fixed rule", -settings.T7_PAIR_DX, settings.T7_PAIR_LBL_Y,
                    settings.EQ_SCALE, GREEN_C)
        lbl_b = txt("random rule", settings.T7_PAIR_DX, settings.T7_PAIR_LBL_Y,
                    settings.EQ_SCALE, CORAL_C)
        self.play(FadeIn(cap), Create(plant), run_time=settings.SLOW)
        self.play(FadeIn(bolt), run_time=settings.MID)
        self.play(FadeIn(lbl_a), FadeIn(lbl_b))
        self.wait(0.8)
        self.play(FadeOut(plant), FadeOut(bolt), FadeOut(lbl_a), FadeOut(lbl_b))

        self.play(Transform(cap, caption("one settles on a shape, one never repeats")))
        picks = topic05.picks_of(settings.T7_FERN_N, settings.T5_SEED)
        fpts = topic05.run_game(picks)
        fext = topic05.fern_extent(settings.T7_PAIR_H, -settings.T7_PAIR_DX, settings.T7_PAIR_Y)
        fern = topic05.cloud(fpts, picks, fext, single=settings.ACCENT_STRUCTURE)
        bolts = VGroup()
        for i in range(3):
            bx, bp = grid_box(settings.T7_TRIO_ROWS, settings.T7_TRIO_COLS,
                              settings.T7_TRIO_H,
                              (settings.T7_TRIO_X + i * settings.T7_TRIO_DX,
                               settings.T7_PAIR_Y))
            _, o, _ = growth.dbm(settings.T7_TRIO_ROWS, settings.T7_TRIO_COLS,
                                 settings.T7_ETA, settings.T7_SEED + 31 * i)
            bolts.add(cells_group(o, bx, bp))
        one = txt("always the same fern", -settings.T7_PAIR_DX, settings.T7_PAIR_LBL_Y,
                  settings.EQ_SCALE, GREEN_C)
        many = txt("never the same bolt", settings.T7_TRIO_X + settings.T7_TRIO_DX,
                   settings.T7_PAIR_LBL_Y, settings.EQ_SCALE, CORAL_C)
        self.play(FadeIn(fern), FadeIn(one))
        self.play(LaggedStart(*[FadeIn(b) for b in bolts], lag_ratio=0.4), run_time=settings.SLOW)
        self.play(FadeIn(many))
        self.wait(0.8)
        self.play(FadeOut(fern), FadeOut(one), FadeOut(bolts), FadeOut(many))

        self.play(Transform(cap, caption("one number moves the roughness and the dimension")))
        marks = VGroup()
        sc = common.Scale1to2(y=settings.T7_SWEEP_SCALE_Y,
                              length=settings.T7_SWEEP_SCALE_LEN)
        self.play(Create(sc.build()))
        for i, eta in enumerate(settings.T7_SWEEP_ETAS):
            bx, bp = grid_box(settings.T7_SWEEP_ROWS, settings.T7_SWEEP_COLS,
                              settings.T7_SWEEP_H,
                              (settings.T7_SWEEP_X + i * settings.T7_SWEEP_DX,
                               settings.T7_SWEEP_Y))
            _, o, _ = growth.dbm(settings.T7_SWEEP_ROWS, settings.T7_SWEEP_COLS, eta,
                                 settings.T7_SEED)
            d, _ = growth.box_dim(o, settings.T7_BOX_SIZES)
            tree = cells_group(o, bx, bp)
            knob = txt(f"roughness {eta}", settings.T7_SWEEP_X + i * settings.T7_SWEEP_DX,
                       settings.T7_SWEEP_Y - settings.T7_SWEEP_LBL_DY, settings.NAME_SCALE, GOLD_C)
            mark = sc.mark(d, f"{eta} → {d:.3f}", GREEN_C, True)
            marks.add(mark)
            self.play(FadeIn(tree), FadeIn(knob), run_time=settings.MID)
            self.play(FadeIn(mark), run_time=settings.FAST)
        self.wait(0.5)
        note = common.top_note("the randomness is the shape, not a flaw in it")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)
