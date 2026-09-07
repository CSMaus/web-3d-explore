import numpy as np
from manim import (
    Scene, Arc, Dot, Line, Polygon, Rectangle, VGroup, ValueTracker,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, ReplacementTransform, Transform,
    TransformFromCopy, Rotate, always_redraw, rotate_vector,
    DEGREES, OUT, RIGHT,
)

import settings
import common
import topic04
import topic05
from common import BLUE_C, GOLD_C, GREEN_C, CORAL_C, MUTED, caption, poly, txt


def cantor_pieces(level, span):
    pieces = [(-span / 2, span / 2)]
    out = [pieces]
    for _ in range(level):
        nxt = []
        for a, b in pieces:
            third = (b - a) / 3
            nxt.append((a, a + third))
            nxt.append((b - third, b))
        pieces = nxt
        out.append(pieces)
    return out


def bar_row(pieces, y, colour=BLUE_C):
    return VGroup(*[
        Line([a, y, 0], [b, y, 0], color=colour, stroke_width=settings.STROKE_MAIN)
        for a, b in pieces
    ])


def middle_row(pieces, y):
    return VGroup(*[
        Line([a + (b - a) / 3, y, 0], [b - (b - a) / 3, y, 0], color=CORAL_C,
             stroke_width=settings.STROKE_MAIN)
        for a, b in pieces
    ])


class CantorSet(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        span = settings.T6_CANTOR_SPAN
        levels = cantor_pieces(settings.T6_CANTOR_LEVELS, span)

        def row_y(k):
            return settings.T6_CANTOR_Y - k * settings.T6_CANTOR_DY

        cap = caption("take the middle third out, then do it again")
        first = bar_row(levels[0], row_y(0))
        self.play(FadeIn(cap), Create(first))
        pieces = common.readout("pieces:", "1", settings.T6_CAN_READ_X,
                                settings.T6_CAN_READ_Y, BLUE_C)
        plen = common.readout("piece length:", "1", settings.T6_CAN_READ_X,
                              settings.T6_CAN_READ_Y - settings.T6_READ_DY, GOLD_C)
        self.play(FadeIn(pieces), FadeIn(plen))
        self.wait(0.5)

        for k in range(1, settings.T6_CANTOR_LEVELS + 1):
            slow = k <= settings.T6_CAN_SLOW
            copied = bar_row(levels[k - 1], row_y(k))
            self.play(TransformFromCopy(bar_row(levels[k - 1], row_y(k - 1)), copied),
                      run_time=settings.MID if slow else settings.FAST)
            mids = middle_row(levels[k - 1], row_y(k))
            self.play(FadeIn(mids), run_time=settings.FAST)
            if slow:
                self.wait(0.4)
            self.play(
                FadeOut(mids, scale=0.2),
                ReplacementTransform(copied, bar_row(levels[k], row_y(k))),
                Transform(pieces[1], common.value_like(pieces, f"{2 ** k}", BLUE_C)),
                Transform(plen[1], common.value_like(plen, f"1/{3 ** k}", GOLD_C)),
                run_time=settings.MID if slow else settings.FAST,
            )
            if k == settings.T6_CAN_SLOW:
                self.play(Transform(cap, caption("the same cut, inside every piece left")))
        self.wait(0.5)

        rel, value = common.dim_text(2, 3, 0, settings.T6_CAN_DIM_Y)
        struct = txt("2 copies at 1/3", 0, settings.T6_CAN_DIM_Y + settings.T6_STRUCT_DY,
                     settings.EQ_SCALE, MUTED, [(0, 1, BLUE_C), (9, 12, GOLD_C)])
        self.play(FadeIn(struct))
        self.play(FadeIn(rel))
        sc = common.Scale1to2(lo=0.0, hi=1.0, y=settings.T6_CAN_SCALE_Y)
        self.play(Create(sc.build()))
        marks = VGroup(
            sc.mark(0.0, "a point", MUTED, True),
            sc.mark(value, "Cantor dust", GREEN_C, True),
            sc.mark(1.0, "a line", MUTED, True),
        )
        self.play(LaggedStart(*[FadeIn(m) for m in marks], lag_ratio=0.3), run_time=settings.MID)
        note = common.top_note("less than a line, more than a point")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def tri_pts(centre, side):
    h = side * np.sqrt(3) / 2
    cx, cy = centre
    return [
        np.array([cx, cy + 2 * h / 3, 0]),
        np.array([cx - side / 2, cy - h / 3, 0]),
        np.array([cx + side / 2, cy - h / 3, 0]),
    ]


def tri_list(level, centre, side):
    if level == 0:
        return [(centre, side)]
    h = side * np.sqrt(3) / 2
    half = side / 2
    cx, cy = centre
    kids = [
        (cx, cy + h / 4 + h / 12),
        (cx - half / 2, cy - h / 6 - h / 12),
        (cx + half / 2, cy - h / 6 - h / 12),
    ]
    out = []
    for k in kids:
        out.extend(tri_list(level - 1, k, half))
    return out


def middle_tri(centre, side):
    a, b, c = tri_pts(centre, side)
    mid = Polygon((a + b) / 2, (b + c) / 2, (a + c) / 2, stroke_width=0)
    mid.set_fill(CORAL_C, opacity=settings.T6_CUT_FILL)
    return mid


def carpet_list(level, centre, side):
    if level == 0:
        return [(centre, side)]
    third = side / 3
    out = []
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            if i == 0 and j == 0:
                continue
            out.extend(carpet_list(level - 1, (centre[0] + i * third,
                                               centre[1] + j * third), third))
    return out


def middle_cell(centre, side):
    cell = Rectangle(width=side / 3, height=side / 3, stroke_width=0)
    cell.set_fill(CORAL_C, opacity=settings.T6_CUT_FILL)
    cell.move_to([centre[0], centre[1], 0])
    return cell


def sier_tri(level, centre, side):
    if level == 0:
        p = Polygon(*tri_pts(centre, side), stroke_width=0)
        p.set_fill(BLUE_C, opacity=settings.T6_FILL)
        return VGroup(p)
    h = side * np.sqrt(3) / 2
    half = side / 2
    cx, cy = centre
    kids = [
        (cx, cy + h / 4 + h / 12),
        (cx - half / 2, cy - h / 6 - h / 12),
        (cx + half / 2, cy - h / 6 - h / 12),
    ]
    g = VGroup()
    for k in kids:
        g.add(*sier_tri(level - 1, k, half))
    return g


class SierpinskiTriangle(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        centre = (settings.T6_TRI_X, settings.T6_TRI_Y)
        side = settings.T6_TRI_SIDE

        cap = caption("cut out the middle, keep the three corners")
        cur = sier_tri(0, centre, side)
        self.play(FadeIn(cap), FadeIn(cur))
        pieces = common.readout("pieces:", "1", settings.T6_READ_X, settings.T6_READ_Y, BLUE_C)
        plen = common.readout("side:", "1", settings.T6_READ_X,
                              settings.T6_READ_Y - settings.T6_READ_DY, GOLD_C)
        self.play(FadeIn(pieces), FadeIn(plen))
        self.wait(0.5)

        for k in range(1, settings.T6_TRI_LEVELS + 1):
            nxt = sier_tri(k, centre, side)
            cuts = VGroup(*[middle_tri(c, sd) for c, sd in tri_list(k - 1, centre, side)])
            self.play(FadeIn(cuts), run_time=settings.FAST)
            if k <= settings.T6_CUT_SLOW:
                self.wait(0.4)
            self.play(
                FadeOut(cuts, scale=0.3), ReplacementTransform(cur, nxt),
                Transform(pieces[1], common.value_like(pieces, f"{3 ** k}", BLUE_C)),
                Transform(plen[1], common.value_like(plen, f"1/{2 ** k}", GOLD_C)),
                run_time=settings.SLOW if k == 1 else settings.FAST,
            )
            cur = nxt
        self.wait(0.5)

        rel, value = common.dim_text(3, 2, settings.T6_DIM_X, settings.T6_DIM_Y)
        struct = txt("3 copies at 1/2", settings.T6_DIM_X,
                     settings.T6_DIM_Y + settings.T6_STRUCT_DY, settings.EQ_SCALE, MUTED,
                     [(0, 1, BLUE_C), (9, 12, GOLD_C)])
        self.play(FadeIn(struct))
        self.play(FadeIn(rel))
        back = txt("the value the opening's between-shape gave", settings.T6_DIM_X,
                   settings.T6_DIM_Y - settings.T6_BACK_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(back), Indicate(rel, color=GREEN_C))
        sc = common.Scale1to2(y=settings.T6_SCALE_Y)
        self.play(Create(sc.build()))
        self.play(FadeIn(sc.mark(value, "Sierpinski triangle", GREEN_C, True)))
        note = common.top_note("three half-size copies of itself")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def carpet(level, centre, side):
    if level == 0:
        p = Rectangle(width=side, height=side, stroke_width=0)
        p.set_fill(BLUE_C, opacity=settings.T6_FILL)
        p.move_to([centre[0], centre[1], 0])
        return VGroup(p)
    third = side / 3
    g = VGroup()
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            if i == 0 and j == 0:
                continue
            g.add(*carpet(level - 1, (centre[0] + i * third, centre[1] + j * third), third))
    return g


class SierpinskiCarpet(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        centre = (settings.T6_CAR_X, settings.T6_CAR_Y)
        side = settings.T6_CAR_SIDE

        cap = caption("a three-by-three grid, centre removed")
        cur = carpet(0, centre, side)
        self.play(FadeIn(cap), FadeIn(cur))
        third = side / 3
        grid = VGroup()
        for k in (-1, 1):
            grid.add(Line([centre[0] + k * third / 2 * 1, centre[1] - side / 2, 0],
                          [centre[0] + k * third / 2 * 1, centre[1] + side / 2, 0],
                          color=MUTED, stroke_width=settings.STROKE_GRID))
            grid.add(Line([centre[0] - side / 2, centre[1] + k * third / 2, 0],
                          [centre[0] + side / 2, centre[1] + k * third / 2, 0],
                          color=MUTED, stroke_width=settings.STROKE_GRID))
        self.play(Create(grid))
        pieces = common.readout("pieces:", "1", settings.T6_READ_X, settings.T6_READ_Y, BLUE_C)
        plen = common.readout("side:", "1", settings.T6_READ_X,
                              settings.T6_READ_Y - settings.T6_READ_DY, GOLD_C)
        self.play(FadeIn(pieces), FadeIn(plen))
        self.wait(0.5)

        for k in range(1, settings.T6_CAR_LEVELS + 1):
            nxt = carpet(k, centre, side)
            cuts = VGroup(*[middle_cell(c, sd) for c, sd in carpet_list(k - 1, centre, side)])
            self.play(FadeIn(cuts), run_time=settings.FAST)
            if k <= settings.T6_CUT_SLOW:
                self.wait(0.4)
            self.play(
                FadeOut(cuts, scale=0.3), ReplacementTransform(cur, nxt),
                Transform(pieces[1], common.value_like(pieces, f"{8 ** k}", BLUE_C)),
                Transform(plen[1], common.value_like(plen, f"1/{3 ** k}", GOLD_C)),
                run_time=settings.SLOW if k == 1 else settings.FAST,
            )
            cur = nxt
            if k == 1:
                self.play(FadeOut(grid), run_time=settings.FAST)
        self.wait(0.5)

        rel, value = common.dim_text(8, 3, settings.T6_DIM_X, settings.T6_DIM_Y)
        struct = txt("8 copies at 1/3", settings.T6_DIM_X,
                     settings.T6_DIM_Y + settings.T6_STRUCT_DY, settings.EQ_SCALE, MUTED,
                     [(0, 1, BLUE_C), (9, 12, GOLD_C)])
        self.play(FadeIn(struct))
        self.play(FadeIn(rel))
        sc = common.Scale1to2(y=settings.T6_SCALE_Y)
        self.play(Create(sc.build()))
        self.play(FadeIn(sc.mark(value, "Sierpinski carpet", GREEN_C, True)))
        note = common.top_note("thirds again, as in the very first count")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def dragon_pts(level):
    pts = [np.array([0.0, 0.0, 0.0]), np.array([1.0, 0.0, 0.0])]
    for _ in range(level):
        end = pts[-1]
        turned = [end + rotate_vector(p - end, -90 * DEGREES, OUT) for p in reversed(pts[:-1])]
        pts = pts + turned
    return pts


def fit_many(lists, height, centre):
    arr = np.array([p for one in lists for p in one])
    w = arr[:, 0].max() - arr[:, 0].min()
    h = arr[:, 1].max() - arr[:, 1].min()
    k = min(height / h, settings.T6_MAX_W / w)
    mid = np.array([(arr[:, 0].max() + arr[:, 0].min()) / 2,
                    (arr[:, 1].max() + arr[:, 1].min()) / 2, 0])
    off = np.array([centre[0], centre[1], 0])
    return [[(p - mid) * k + off for p in one] for one in lists]


def fit_pts(pts, height, centre):
    arr = np.array(pts)
    w = arr[:, 0].max() - arr[:, 0].min()
    h = arr[:, 1].max() - arr[:, 1].min()
    k = height / max(h, w * 9 / 16)
    mid = np.array([(arr[:, 0].max() + arr[:, 0].min()) / 2,
                    (arr[:, 1].max() + arr[:, 1].min()) / 2, 0])
    return [(p - mid) * k + np.array([centre[0], centre[1], 0]) for p in pts]


class DragonCurve(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        centre = (settings.T6_DRG_X, settings.T6_DRG_Y)
        height = settings.T6_DRG_H

        cap = caption("fold the strip in half, then unfold every joint square")
        half = settings.T6_FOLD_SPAN / 2
        mid = np.array([settings.T6_FOLD_X, settings.T6_FOLD_Y, 0])
        left_half = Line(mid - RIGHT * half, mid, color=MUTED,
                         stroke_width=settings.STROKE_GRID + 1)
        right_half = Line(mid, mid + RIGHT * half, color=GOLD_C,
                          stroke_width=settings.STROKE_GRID + 1)
        fold_lbl = txt("fold it in half", settings.T6_FOLD_X,
                       settings.T6_FOLD_Y - settings.T6_FOLD_LBL_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(cap), FadeIn(left_half), FadeIn(right_half))
        self.play(FadeIn(fold_lbl))
        self.play(Rotate(right_half, np.pi, about_point=mid), run_time=settings.SLOW)
        self.wait(0.4)
        self.play(Transform(fold_lbl, txt("open the joint to a right angle",
                                          settings.T6_FOLD_X,
                                          settings.T6_FOLD_Y - settings.T6_FOLD_LBL_DY,
                                          settings.NAME_SCALE, MUTED)))
        self.play(Rotate(right_half, -np.pi / 2, about_point=mid), run_time=settings.SLOW)
        self.wait(0.5)
        self.play(FadeOut(fold_lbl), run_time=settings.FAST)
        shown = fit_pts(dragon_pts(0), height, centre)
        cur = poly(shown, BLUE_C, settings.STROKE_MAIN)
        self.play(FadeIn(cap), Create(cur))
        folds = common.readout("folds:", "0", settings.T6_READ_X, settings.T6_READ_Y, GOLD_C)
        self.play(FadeIn(folds))
        self.wait(0.5)

        for k in range(1, settings.T6_DRG_SLOW + 1):
            base = fit_pts(dragon_pts(k - 1), height, centre)
            nxt_raw = dragon_pts(k)
            end = base[-1]
            copy_pts = [end + rotate_vector(p - end, -90 * DEGREES, OUT)
                        for p in reversed(base[:-1])]
            ghost = poly(base, GOLD_C, settings.STROKE_GRID + 1)
            turned = poly(copy_pts, GOLD_C, settings.STROKE_GRID + 1)
            self.play(TransformFromCopy(cur, ghost), run_time=settings.FAST)
            self.play(Transform(ghost, turned), run_time=settings.MID)
            joined = fit_pts(nxt_raw, height, centre)
            nxt = poly(joined, BLUE_C, settings.STROKE_MAIN if k < 3 else settings.STROKE_GRID + 2)
            self.play(
                ReplacementTransform(VGroup(cur, ghost), nxt),
                Transform(folds[1], common.value_like(folds, f"{k}", GOLD_C)),
                run_time=settings.MID,
            )
            cur = nxt
            self.wait(0.3)

        self.play(Transform(cap, caption("the same fold, many times over")))
        for k in range(settings.T6_DRG_SLOW + 1, settings.T6_DRG_LEVELS + 1):
            nxt = poly(fit_pts(dragon_pts(k), height, centre), BLUE_C, settings.STROKE_GRID + 1)
            self.play(
                ReplacementTransform(cur, nxt),
                Transform(folds[1], common.value_like(folds, f"{k}", GOLD_C)),
                run_time=settings.FAST,
            )
            cur = nxt

        raw = dragon_pts(settings.T6_TILE_LEVEL)
        pivot = raw[0]
        quarters = [
            [pivot + rotate_vector(p - pivot, 90 * i * DEGREES, OUT) for p in raw]
            for i in range(4)
        ]
        placed = fit_many(quarters, settings.T6_TILE_H, (settings.T6_TILE_X, settings.T6_TILE_Y))
        tiles = VGroup(*[
            poly(one, colour, settings.STROKE_GRID)
            for one, colour in zip(placed, (BLUE_C, GOLD_C, GREEN_C, CORAL_C))
        ])
        self.play(FadeOut(cur), FadeOut(folds))
        self.play(FadeIn(tiles[0]))
        self.play(LaggedStart(*[FadeIn(t) for t in tiles[1:]], lag_ratio=0.5),
                  run_time=settings.SLOW)
        self.play(Transform(cap, caption("four copies, each turned one more quarter turn")))
        self.wait(0.6)
        note = common.top_note("copies of the same curve fit together with no gaps")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def expand(seed, rules, passes):
    out = seed
    for _ in range(passes):
        out = "".join(rules.get(c, c) for c in out)
    return out


def turtle(word, angle, step, start, heading):
    pos = np.array([start[0], start[1], 0], dtype=float)
    head = float(heading)
    stack = []
    segs = []
    for c in word:
        if c in "FA B".replace(" ", ""):
            nxt = pos + step * np.array([np.cos(head), np.sin(head), 0])
            segs.append((pos, nxt))
            pos = nxt
        elif c == "+":
            head += angle
        elif c == "-":
            head -= angle
        elif c == "[":
            stack.append((pos.copy(), head))
        elif c == "]":
            pos, head = stack.pop()
    return segs


def segs_group(segs, colour, width):
    return VGroup(*[Line(a, b, color=colour, stroke_width=width) for a, b in segs])


def fit_segs(segs, height, centre):
    arr = np.array([p for s in segs for p in s])
    h = arr[:, 1].max() - arr[:, 1].min()
    w = arr[:, 0].max() - arr[:, 0].min()
    k = height / max(h, 1e-9)
    if w * k > settings.T6_MAX_W:
        k = settings.T6_MAX_W / w
    mid = np.array([(arr[:, 0].max() + arr[:, 0].min()) / 2,
                    (arr[:, 1].max() + arr[:, 1].min()) / 2, 0])
    off = np.array([centre[0], centre[1], 0])
    return [((a - mid) * k + off, (b - mid) * k + off) for a, b in segs]


def segs_in_box(segs, centre, half):
    out = []
    for a, b in segs:
        if (abs(a[0] - centre[0]) <= half and abs(a[1] - centre[1]) <= half
                and abs(b[0] - centre[0]) <= half and abs(b[1] - centre[1]) <= half):
            out.append((a, b))
    return out


def place_segs(segs, centre, half, target, size):
    k = size / (2 * half)
    off = np.array([target[0], target[1], 0])
    mid = np.array([centre[0], centre[1], 0])
    return [((a - mid) * k + off, (b - mid) * k + off) for a, b in segs]


ALPHABET = (
    ("F", "draw forward"),
    ("+", "turn left"),
    ("-", "turn right"),
    ("[", "remember this point"),
    ("]", "go back to it"),
)


class PlantLSystem(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        rules = dict(settings.T6_PLANT_RULES)
        angle = settings.T6_PLANT_ANGLE * DEGREES

        cap = caption("five symbols, and what each one does")
        legend = VGroup()
        for i, (sym, meaning) in enumerate(ALPHABET):
            row = common.line_of([(sym, GOLD_C), (meaning, MUTED)], settings.T6_SYM_X,
                                 settings.T6_SYM_Y - i * settings.T6_SYM_DY,
                                 settings.EQ_SCALE, 0.4)
            legend.add(row)
        self.play(FadeIn(cap))

        pos = np.array([settings.T6_TURTLE_X, settings.T6_TURTLE_Y, 0])
        head = np.pi / 2
        stack = []
        walker = Dot(pos, color=BLUE_C, radius=settings.T5_DOT_R)
        self.play(FadeIn(walker))
        shown = set()
        drawn = VGroup(walker)
        for sym in settings.T6_SYM_DEMO:
            idx = [a for a, _ in ALPHABET].index(sym)
            if sym not in shown:
                self.play(FadeIn(legend[idx]), run_time=settings.FAST)
                shown.add(sym)
            self.play(Indicate(legend[idx], color=GOLD_C), run_time=settings.FAST)
            if sym == "F":
                nxt = pos + settings.T6_TURTLE_STEP * np.array([np.cos(head), np.sin(head), 0])
                seg = Line(pos, nxt, color=BLUE_C, stroke_width=settings.STROKE_MAIN)
                self.play(Create(seg), walker.animate.move_to(nxt), run_time=settings.MID)
                drawn.add(seg)
                pos = nxt
            elif sym in "+-":
                turn = angle if sym == "+" else -angle
                arc = Arc(radius=settings.T6_ARC_R, start_angle=head,
                          angle=turn, arc_center=pos, color=GOLD_C,
                          stroke_width=settings.STROKE_GRID + 1)
                self.play(Create(arc), run_time=settings.FAST)
                head += turn
                drawn.add(arc)
            elif sym == "[":
                stack.append((pos.copy(), head))
                mark = Dot(pos, color=CORAL_C, radius=settings.T6_MARK_R)
                self.play(FadeIn(mark), run_time=settings.FAST)
                drawn.add(mark)
            elif sym == "]":
                pos, head = stack.pop()
                self.play(walker.animate.move_to(pos), run_time=settings.MID)
        self.wait(0.6)
        self.play(FadeOut(drawn),
                  legend.animate.scale(settings.T6_LEG_SHRINK).move_to(
                      [settings.T6_LEG_KEEP_X, settings.T6_LEG_KEEP_Y, 0]))

        cap2 = caption("one seed, one rewriting rule")
        self.play(Transform(cap, cap2))
        alpha = txt(settings.T6_PLANT_SHOWN, 0, settings.T6_RULE_Y, settings.EQ_SCALE, MUTED)
        turn = txt(f"turn {settings.T6_PLANT_ANGLE} degrees", 0,
                   settings.T6_RULE_Y - settings.T6_RULE_DY, settings.NAME_SCALE, GOLD_C)
        self.play(FadeIn(cap), FadeIn(alpha), FadeIn(turn))
        self.wait(0.5)

        passes = common.readout("passes:", "0", settings.T6_PASS_X, settings.T6_PASS_Y, GOLD_C)
        self.play(FadeIn(passes))
        cur = None
        for k in range(1, settings.T6_PLANT_PASSES + 1):
            word = expand(settings.T6_PLANT_SEED, rules, k)
            segs = fit_segs(turtle(word, angle, 1.0, (0, 0), np.pi / 2),
                            settings.T6_PLANT_H, (settings.T6_PLANT_X, settings.T6_PLANT_Y))
            width = settings.STROKE_MAIN if k < 3 else settings.STROKE_GRID + 1
            nxt = segs_group(segs, BLUE_C, width)
            if cur is None:
                self.play(Create(nxt), Transform(passes[1],
                                                 common.value_like(passes, f"{k}", GOLD_C)),
                          run_time=settings.SLOW * 1.5)
            else:
                self.play(ReplacementTransform(cur, nxt),
                          Transform(passes[1], common.value_like(passes, f"{k}", GOLD_C)),
                          run_time=settings.SLOW if k < 4 else settings.MID)
            cur = nxt
            self.wait(0.35)

        word = expand(settings.T6_PLANT_SEED, rules, settings.T6_PLANT_PASSES)
        segs = fit_segs(turtle(word, angle, 1.0, (0, 0), np.pi / 2),
                        settings.T6_PLANT_H, (settings.T6_PLANT_X, settings.T6_PLANT_Y))
        anchor = segs[int(len(segs) * settings.T6_PLANT_ZOOM_AT)][0]
        half = settings.T6_PLANT_ZHALF
        picked = segs_in_box(segs, anchor, half)
        src = Rectangle(width=2 * half, height=2 * half, color=MUTED,
                        stroke_width=settings.STROKE_GRID)
        src.move_to([anchor[0], anchor[1], 0])
        target = settings.T6_PLANT_ZT
        size = settings.T6_PLANT_ZH
        inset = segs_group(place_segs(picked, anchor, half, target, size), BLUE_C,
                           settings.STROKE_GRID + 1)
        dst = Rectangle(width=size, height=size, color=MUTED, stroke_width=settings.STROKE_GRID)
        dst.move_to([target[0], target[1], 0])
        self.play(Create(src))
        self.play(Create(dst), FadeIn(inset), run_time=settings.MID)
        note = common.top_note("a tiny rule set, an organic form")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def place_base(segs, a, b):
    start = np.array(segs[0][0], dtype=float)
    end = np.array(segs[-1][1], dtype=float)
    src = end - start
    dst = np.asarray(b, dtype=float) - np.asarray(a, dtype=float)
    k = np.linalg.norm(dst) / np.linalg.norm(src)
    turn = np.arctan2(dst[1], dst[0]) - np.arctan2(src[1], src[0])
    out = []
    for p, q in segs:
        moved = []
        for point in (p, q):
            v = (np.asarray(point, dtype=float) - start) * k
            moved.append(np.asarray(a, dtype=float)
                         + rotate_vector(v, turn, OUT))
        out.append((moved[0], moved[1]))
    return out, k


class GosperCurve(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        rules = dict(settings.T6_GOS_RULES)
        angle = settings.T6_GOS_ANGLE * DEGREES

        cap = caption("a base path of seven segments")
        base_word = expand(settings.T6_GOS_SEED, rules, 1)
        base = fit_segs(turtle(base_word, angle, 1.0, (0, 0), 0.0),
                        settings.T6_GOS_BASE_H, (settings.T6_GOS_BASE_X, settings.T6_GOS_BASE_Y))
        count = common.readout("segments:", "0", settings.T6_GOS_READ_X,
                               settings.T6_GOS_READ_Y, BLUE_C)
        self.play(FadeIn(cap), FadeIn(count))
        drawn = VGroup()
        for i, (a, b) in enumerate(base):
            piece = Line(a, b, color=BLUE_C, stroke_width=settings.STROKE_MAIN)
            drawn.add(piece)
            self.play(Create(piece),
                      Transform(count[1], common.value_like(count, f"{i + 1}", BLUE_C)),
                      run_time=settings.FAST)
        self.wait(0.6)

        self.play(Transform(cap, caption("each segment is replaced by that same path")))
        target = base[0]
        mark = Line(target[0], target[1], color=GOLD_C,
                    stroke_width=settings.STROKE_MAIN + 2)
        self.play(Create(mark))
        placed, ratio = place_base(base, target[0], target[1])
        copy_group = VGroup(*[Line(a, b, color=GOLD_C, stroke_width=settings.STROKE_GRID + 1)
                              for a, b in placed])
        self.play(TransformFromCopy(drawn, copy_group), run_time=settings.SLOW)
        ratio_lbl = txt(f"each copy is {ratio:.3f} as long", settings.T6_GOS_READ_X,
                        settings.T6_GOS_READ_Y - settings.T6_GOS_READ_DY,
                        settings.EQ_SCALE, GOLD_C)
        root_lbl = txt("that is 1 over the square root of 7", settings.T6_GOS_READ_X,
                       settings.T6_GOS_READ_Y - 2 * settings.T6_GOS_READ_DY,
                       settings.NAME_SCALE, MUTED)
        self.play(FadeIn(ratio_lbl))
        self.play(FadeIn(root_lbl))
        self.wait(0.8)
        self.play(FadeOut(mark), FadeOut(copy_group), FadeOut(drawn), FadeOut(count),
                  FadeOut(ratio_lbl), FadeOut(root_lbl))

        self.play(Transform(cap, caption("now every segment at once, over and over")))
        cur = None
        shown_count = None
        for k in range(1, settings.T6_GOS_PASSES + 1):
            word = expand(settings.T6_GOS_SEED, rules, k)
            segs = fit_segs(turtle(word, angle, 1.0, (0, 0), 0.0),
                            settings.T6_GOS_H, (settings.T6_GOS_X, settings.T6_GOS_Y))
            if k >= settings.T6_GOS_POLY_FROM:
                path = [segs[0][0]] + [b for a, b in segs]
                nxt = poly(path, BLUE_C, max(1, settings.STROKE_GRID - k + 3))
            else:
                nxt = segs_group(segs, BLUE_C,
                                 settings.STROKE_MAIN if k == 1 else settings.STROKE_GRID + 1)
            count = common.readout("segments:", f"{len(segs)}", settings.T6_GOS_READ_X,
                                   settings.T6_GOS_READ_Y - settings.T6_GOS_READ_DY,
                                   BLUE_C)
            if cur is None:
                self.play(Create(nxt), FadeIn(count), run_time=settings.SLOW)
            else:
                self.play(FadeOut(cur), FadeOut(shown_count), run_time=settings.FAST)
                self.play(Create(nxt), FadeIn(count), run_time=settings.SLOW)
            cur = nxt
            shown_count = count
            self.wait(0.5)
        note = common.top_note("a curve that fills its own island")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def menger_cells(level):
    cells = [(0, 0, 0)]
    for _ in range(level):
        nxt = []
        for cx, cy, cz in cells:
            for i in (-1, 0, 1):
                for j in (-1, 0, 1):
                    for k in (-1, 0, 1):
                        if (i == 0) + (j == 0) + (k == 0) >= 2:
                            continue
                        nxt.append((cx * 3 + i, cy * 3 + j, cz * 3 + k))
        cells = nxt
    return cells


def sponge(level, size, ty, at):
    return sponge_of(menger_cells(level), level, size, ty, at)


def sponge_of(cells, level, size, ty, at, dark=None, bright=None):
    step = size / 3 ** level
    centres = [(np.array(c, dtype=float) * step) for c in cells]
    return common.solid(centres, step * settings.T6_MENGER_FILL, settings.TILT_X, ty, at,
                        dark, bright)


def split_cells(level):
    kept = []
    gone = []
    for base in menger_cells(level - 1) if level > 1 else [(0, 0, 0)]:
        for i in (-1, 0, 1):
            for j in (-1, 0, 1):
                for k in (-1, 0, 1):
                    cell = (base[0] * 3 + i, base[1] * 3 + j, base[2] * 3 + k)
                    if (i == 0) + (j == 0) + (k == 0) >= 2:
                        gone.append(cell)
                    else:
                        kept.append(cell)
    return kept, gone


class MengerSponge(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        size = settings.T6_MENGER_SIZE
        at = (settings.T6_MENGER_X, settings.T6_MENGER_Y)

        cap = caption("a solid cube, hollowed out by the same rule")
        spin = ValueTracker(settings.TILT_Y)
        first = sponge(0, size, spin.get_value(), at)
        self.play(FadeIn(cap), FadeIn(first))
        self.remove(first)
        body = always_redraw(lambda: sponge(0, size, spin.get_value(), at))
        self.add(body)
        self.play(spin.animate.set_value(spin.get_value() + settings.T6_MENGER_SPIN),
                  run_time=settings.SLOW)
        self.wait(0.3)

        pieces = common.readout("pieces:", "1", settings.T6_READ_X, settings.T6_READ_Y, BLUE_C)
        plen = common.readout("side:", "1", settings.T6_READ_X,
                              settings.T6_READ_Y - settings.T6_READ_DY, GOLD_C)
        self.play(FadeIn(pieces), FadeIn(plen))

        for k in range(1, settings.T6_MENGER_LEVELS + 1):
            self.remove(body)
            prev = sponge(k - 1, size, spin.get_value(), at)
            fresh = sponge(k, size, spin.get_value(), at)
            if k == 1:
                kept, gone = split_cells(k)
                whole = sponge_of(kept + gone, k, size, spin.get_value(), at)
                doomed = sponge_of(gone, k, size, spin.get_value(), at,
                                   settings.T6_CUT_DARK, settings.T6_CUT_BRIGHT)
                self.add(prev)
                self.play(FadeOut(prev), FadeIn(whole), run_time=settings.MID)
                cut_lbl = txt("cut into 27", settings.T6_READ_X,
                              settings.T6_READ_Y + settings.T6_READ_DY, settings.EQ_SCALE,
                              MUTED)
                self.play(FadeIn(cut_lbl))
                self.wait(0.5)
                self.play(FadeIn(doomed), run_time=settings.MID)
                gone_lbl = txt("take out the middle of each face, and the middle of the cube",
                               0, settings.T6_CUT_LBL_Y, settings.NAME_SCALE, CORAL_C)
                buried = txt("the seventh one is buried in the centre, out of sight", 0,
                             settings.T6_CUT_LBL_Y - settings.T6_CUT_LBL_DY,
                             settings.NAME_SCALE, MUTED)
                self.play(FadeIn(gone_lbl))
                self.play(FadeIn(buried))
                self.wait(0.8)
                self.play(FadeOut(doomed, scale=0.4), FadeOut(whole), FadeIn(fresh),
                          FadeOut(gone_lbl), FadeOut(buried), FadeOut(cut_lbl),
                          Transform(pieces[1], common.value_like(pieces, f"{20 ** k}", BLUE_C)),
                          Transform(plen[1], common.value_like(plen, f"1/{3 ** k}", GOLD_C)),
                          run_time=settings.SLOW)
                self.remove(fresh)
                body = always_redraw(lambda k=k: sponge(k, size, spin.get_value(), at))
                self.add(body)
                self.play(spin.animate.set_value(spin.get_value() + settings.T6_MENGER_SPIN),
                          run_time=settings.SLOW)
                self.wait(0.3)
                continue
            self.add(prev)
            self.play(
                FadeOut(prev), FadeIn(fresh),
                Transform(pieces[1], common.value_like(pieces, f"{20 ** k}", BLUE_C)),
                Transform(plen[1], common.value_like(plen, f"1/{3 ** k}", GOLD_C)),
                run_time=settings.MID,
            )
            self.remove(fresh)
            body = always_redraw(lambda k=k: sponge(k, size, spin.get_value(), at))
            self.add(body)
            self.play(spin.animate.set_value(spin.get_value() + settings.T6_MENGER_SPIN),
                      run_time=settings.SLOW)
            self.wait(0.3)

        rel, value = common.dim_text(20, 3, settings.T6_DIM_X, settings.T6_DIM_Y)
        struct = txt("20 copies at 1/3", settings.T6_DIM_X,
                     settings.T6_DIM_Y + settings.T6_STRUCT_DY, settings.EQ_SCALE, MUTED,
                     [(0, 2, BLUE_C), (10, 13, GOLD_C)])
        self.play(FadeIn(struct))
        self.play(FadeIn(rel))
        note = common.top_note("more than a surface, less than a solid")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def thumb_cantor():
    levels = cantor_pieces(settings.T6_THUMB_LEVELS, settings.T6_THUMB_SPAN)
    return VGroup(*[bar_row(pieces, -k * settings.T6_THUMB_DY)
                    for k, pieces in enumerate(levels)])


def thumb_koch():
    return poly(topic04.koch_span(2.0, 0.0, 4), BLUE_C, settings.STROKE_GRID)


def thumb_dragon():
    return poly(fit_pts(dragon_pts(10), 2.0, (0.0, 0.0)), BLUE_C, settings.STROKE_GRID)


def thumb_gosper():
    word = expand(settings.T6_GOS_SEED, dict(settings.T6_GOS_RULES), 2)
    segs = turtle(word, settings.T6_GOS_ANGLE * DEGREES, 1.0, (0, 0), 0.0)
    return segs_group(fit_segs(segs, 2.0, (0.0, 0.0)), BLUE_C, settings.STROKE_GRID)


def thumb_menger():
    return sponge(1, settings.T6_TH_MENGER, settings.TILT_Y, (0.0, 0.0))


def thumb_fern(centre):
    picks = topic05.picks_of(settings.T6_TH_FERN_N, settings.T5_SEED)
    pts = topic05.run_game(picks)
    extent = topic05.fern_extent(settings.T6_TH_H, centre[0], centre[1])
    return topic05.cloud(pts, picks, extent, single=settings.ACCENT_STRUCTURE), pts


class CommonThread(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        step = settings.T6_TH_SPAN / 7
        xs = [-settings.T6_TH_SPAN / 2 + i * step for i in range(8)]
        fern_img, fern_pts = thumb_fern((xs[3], settings.T6_TH_Y))
        fern_d = -np.polyfit(
            np.log(settings.T5_BOX_SIZES),
            np.log([len(topic05.occupied(fern_pts, s)) for s in settings.T5_BOX_SIZES]), 1)[0]

        entries = [
            (thumb_cantor(), "Cantor dust", float(np.log(2) / np.log(3)), True, True),
            (thumb_koch(), "Koch curve", float(np.log(4) / np.log(3)), False, True),
            (sier_tri(4, (0.0, 0.0), 2.0), "Sierpinski triangle",
             float(np.log(3) / np.log(2)), True, True),
            (fern_img, "Barnsley fern", float(fern_d), False, True),
            (carpet(3, (0.0, 0.0), 2.0), "Sierpinski carpet",
             float(np.log(8) / np.log(3)), True, True),
            (thumb_dragon(), "dragon curve", 2.0, False, True),
            (thumb_gosper(), "flowsnake", 2.0, True, False),
            (thumb_menger(), "Menger sponge", float(np.log(20) / np.log(3)), True, True),
        ]

        cap = caption("one rule, repeated without end")
        sc = common.Scale1to2(lo=0.0, hi=3.0, y=settings.T6_TH_SCALE_Y,
                              length=settings.T6_TH_SCALE_LEN)
        self.play(FadeIn(cap), Create(sc.build()))

        for i, (mob, name, value, up, show) in enumerate(entries):
            centre = (xs[i], settings.T6_TH_Y)
            if mob is not fern_img:
                common.fit_box(mob, settings.T6_TH_W, settings.T6_TH_H, centre)
            lbl = txt(name, centre[0], centre[1] - settings.T6_TH_LBL_DY,
                      settings.T6_TH_LBL_SCALE, MUTED)
            target = sc.at(value)
            drop = Line([centre[0], centre[1] - settings.T6_TH_LBL_DY - 0.2, 0], target,
                        color=MUTED, stroke_width=1)
            dot = common.Dot(target, color=GREEN_C, radius=settings.SCALE_DOT_R)
            sign = 1 if up else -1
            self.play(FadeIn(mob), FadeIn(lbl), run_time=settings.FAST)
            extra = [FadeIn(txt(f"{value:.3f}", target[0],
                                target[1] + sign * settings.T6_TH_VAL_DY,
                                settings.NAME_SCALE, GREEN_C))] if show else []
            self.play(Create(drop), FadeIn(dot), *extra, run_time=settings.FAST)

        note = common.top_note("a simple rule, applied without end, and a dimension between the whole numbers")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


DRAGON_MAPS = (
    (np.array([[0.5, -0.5], [0.5, 0.5]]), np.array([0.0, 0.0])),
    (np.array([[-0.5, -0.5], [0.5, -0.5]]), np.array([1.0, 0.0])),
)


def dapply(m, t, p):
    v = m @ np.array([p[0], p[1]]) + t
    return np.array([v[0], v[1], 0.0])


def lin(row, shift):
    parts = []
    if shift:
        parts.append(f"{shift:g}")
    for co, var in zip(row, ("x", "y")):
        if not parts:
            parts.append(f"{'-' if co < 0 else ''}{abs(co):g}{var}")
        else:
            parts.append(f"{'-' if co < 0 else '+'} {abs(co):g}{var}")
    return " ".join(parts)


def map_line(name, m, t):
    return f"{name}(x, y) = ({lin(m[0], t[0])},   {lin(m[1], t[1])})"


def dragon_ifs(level):
    pts = [np.array([0.0, 0.0, 0.0]), np.array([1.0, 0.0, 0.0])]
    for _ in range(level):
        m1, t1 = DRAGON_MAPS[0]
        m2, t2 = DRAGON_MAPS[1]
        head = [dapply(m1, t1, p) for p in pts]
        tail = [dapply(m2, t2, p) for p in reversed(pts)]
        pts = head + tail[1:]
    return pts


def dragon_frame(pts, height, centre):
    arr = np.array(pts)
    mid = np.array([(arr[:, 0].max() + arr[:, 0].min()) / 2,
                    (arr[:, 1].max() + arr[:, 1].min()) / 2, 0.0])
    k = height / (arr[:, 1].max() - arr[:, 1].min())
    off = np.array([centre[0], centre[1], 0.0]) - mid * k
    return k, off


def onscreen(pts, k, off):
    return [np.array([p[0] * k + off[0], p[1] * k + off[1], 0.0]) for p in pts]


def square_loop(centre, side):
    a = side / 2
    cx, cy = centre
    return [np.array([cx - a, cy - a, 0.0]), np.array([cx + a, cy - a, 0.0]),
            np.array([cx + a, cy + a, 0.0]), np.array([cx - a, cy + a, 0.0]),
            np.array([cx - a, cy - a, 0.0])]


def widest(pieces, k):
    span = 0.0
    for one in pieces:
        arr = np.array(one)[:, :2]
        gap = arr[:, None, :] - arr[None, :, :]
        span = max(span, float(np.hypot(gap[..., 0], gap[..., 1]).max()))
    return span * k


def julia_backward(c, n, warm, seed):
    rng = np.random.default_rng(seed)
    cc = complex(c[0], c[1])
    z = complex(0.4, 0.4)
    out = []
    for i in range(n + warm):
        w = (z - cc) ** 0.5
        if rng.integers(2):
            w = -w
        z = w
        if i >= warm:
            out.append((z.real, z.imag))
    return np.array(out)


def pts_image(pts, colour, height, centre, pad):
    arr = np.asarray(pts, dtype=float)[:, :2]
    x0, x1 = arr[:, 0].min() - pad, arr[:, 0].max() + pad
    y0, y1 = arr[:, 1].min() - pad, arr[:, 1].max() + pad
    cols = np.tile(common.rgb(colour), (len(arr), 1))
    img = common.raster(arr, cols, (x0, x1, y0, y1))
    w = height * (x1 - x0) / (y1 - y0)
    box = (centre[0] - w / 2, centre[0] + w / 2,
           centre[1] - height / 2, centre[1] + height / 2)
    return common.image_at(img, box)


class DragonMaps(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        raw = dragon_ifs(settings.T6D_LEVEL)
        k, off = dragon_frame(raw, settings.T6D_H, (settings.T6D_X, settings.T6D_Y))
        shown = onscreen(raw, k, off)
        curve = poly(shown, BLUE_C, settings.STROKE_GRID + 1)

        cap = caption("the dragon is what two moves settle onto")
        self.play(FadeIn(cap), Create(curve), run_time=settings.SLOW)
        self.wait(0.4)

        halves = []
        for i, (m, t) in enumerate(DRAGON_MAPS):
            colour = (GREEN_C, CORAL_C)[i]
            piece = onscreen([dapply(m, t, p) for p in raw], k, off)
            ghost = curve.copy().set_color(colour)
            self.add(ghost)
            self.play(Transform(ghost, poly(piece, colour, settings.STROKE_GRID + 1)),
                      run_time=settings.SLOW)
            row = txt(map_line(f"f{i + 1}", m, t), settings.T6D_EQ_X,
                      settings.T6D_EQ_Y - i * settings.T6D_EQ_DY, settings.T6D_EQ_SCALE, colour)
            self.play(FadeIn(row), run_time=settings.FAST)
            halves.append(VGroup(ghost, row))
            self.wait(0.3)

        shrink = float(np.linalg.svd(DRAGON_MAPS[0][0], compute_uv=False)[0])
        turns = [float(np.degrees(np.arctan2(m[1, 0], m[0, 0]))) % 360
                 for m, t in DRAGON_MAPS]
        facts = VGroup(
            txt(f"each shrinks by {shrink:.3f}", settings.T6D_EQ_X,
                settings.T6D_EQ_Y - 2.4 * settings.T6D_EQ_DY, settings.T6D_EQ_SCALE, GOLD_C),
            txt(f"one turns {turns[0]:.0f} degrees, the other {turns[1]:.0f}",
                settings.T6D_EQ_X, settings.T6D_EQ_Y - 3.4 * settings.T6D_EQ_DY,
                settings.T6D_EQ_SCALE, GOLD_C),
            txt("the two copies together are the whole curve", settings.T6D_EQ_X,
                settings.T6D_EQ_Y - 4.4 * settings.T6D_EQ_DY, settings.T6D_EQ_SCALE, MUTED))
        for one in facts:
            self.play(FadeIn(one), run_time=settings.FAST)
        self.play(Indicate(VGroup(halves[0][0], halves[1][0]), color=GOLD_C),
                  run_time=settings.MID)
        self.wait(0.6)
        self.play(FadeOut(VGroup(*[h for h in halves])), FadeOut(facts))

        self.play(Transform(cap, caption("start from any shape and apply the two moves")))
        start = square_loop(settings.T6D_START, settings.T6D_SIDE)
        pieces = [start]
        drawn = VGroup(poly(onscreen(start, k, off), GOLD_C, settings.STROKE_GRID + 1))
        self.play(FadeOut(curve), FadeIn(drawn))
        n_read = common.readout("pieces:", "1", settings.T6D_EQ_X, settings.T6D_EQ_Y, BLUE_C)
        w_read = common.readout("widest piece:", f"{widest(pieces, k):.2f}",
                                settings.T6D_EQ_X, settings.T6D_EQ_Y - settings.T6D_EQ_DY,
                                GOLD_C)
        self.play(FadeIn(n_read), FadeIn(w_read))
        for step in range(settings.T6D_PASSES):
            pieces = [[dapply(m, t, p) for p in one]
                      for one in pieces for m, t in DRAGON_MAPS]
            width = settings.STROKE_GRID + 1 if step < settings.T6D_SLOW_PASSES else 1
            nxt = VGroup(*[poly(onscreen(one, k, off), GOLD_C, width) for one in pieces])
            self.play(
                ReplacementTransform(drawn, nxt),
                Transform(n_read[1], common.value_like(n_read, f"{len(pieces)}", BLUE_C)),
                Transform(w_read[1],
                          common.value_like(w_read, f"{widest(pieces, k):.2f}", GOLD_C)),
                run_time=settings.MID if step < settings.T6D_SLOW_PASSES else settings.FAST)
            drawn = nxt
        self.play(FadeIn(curve), run_time=settings.MID)
        self.wait(0.5)
        self.play(FadeOut(drawn), FadeOut(n_read), FadeOut(w_read))

        self.play(Transform(cap, caption("the fern needed four moves, the dragon needs two")))
        picks = topic05.picks_of(settings.T6D_FERN_N, settings.T5_SEED)
        fpts = topic05.run_game(picks)
        fext = topic05.fern_extent(settings.T6D_FERN_H, settings.T6D_FERN_X,
                                   settings.T6D_FERN_Y)
        fern = topic05.cloud(fpts, picks, fext, single=settings.ACCENT_STABLE)
        lbl_f = txt("four moves", settings.T6D_FERN_X,
                    settings.T6D_FERN_Y - settings.T6D_LBL_DY, settings.EQ_SCALE, GREEN_C)
        lbl_d = txt("two moves", settings.T6D_X, settings.T6D_Y - settings.T6D_LBL_DY,
                    settings.EQ_SCALE, BLUE_C)
        self.play(FadeIn(fern), FadeIn(lbl_f), FadeIn(lbl_d), run_time=settings.MID)
        same = txt("the same machinery, a different set of moves", 0, settings.T6_SCALE_Y,
                   settings.EQ_SCALE, MUTED)
        self.play(FadeIn(same))
        self.wait(0.8)
        self.play(FadeOut(fern), FadeOut(lbl_f), FadeOut(lbl_d), FadeOut(same))

        self.play(Transform(cap, caption("a Julia set is a two-move attractor as well")))
        jpts = julia_backward(settings.T6D_JULIA_C, settings.T6D_JULIA_N,
                              settings.T6D_JULIA_WARM, settings.T6D_SEED)
        jimg = pts_image(jpts, settings.ACCENT_CONTRAST, settings.T6D_JULIA_H,
                         (settings.T6D_JULIA_X, settings.T6D_JULIA_Y), settings.T6D_PAD)
        self.play(FadeIn(jimg), run_time=settings.MID)
        jrows = VGroup(
            txt(f"c = {settings.T6D_JULIA_C[0]:g} + {settings.T6D_JULIA_C[1]:g}i",
                settings.T6D_JULIA_X, settings.T6D_JULIA_Y - settings.T6D_LBL_DY,
                settings.EQ_SCALE, CORAL_C),
            txt("g1(z) = +√(z - c)", settings.T6D_JULIA_X,
                settings.T6D_JULIA_Y - settings.T6D_LBL_DY - 0.6, settings.T6D_EQ_SCALE,
                CORAL_C),
            txt("g2(z) = -√(z - c)", settings.T6D_JULIA_X,
                settings.T6D_JULIA_Y - settings.T6D_LBL_DY - 1.15, settings.T6D_EQ_SCALE,
                CORAL_C))
        for one in jrows:
            self.play(FadeIn(one), run_time=settings.FAST)
        told = VGroup(
            txt("the dragon's moves keep straight lines straight, so it tiles the plane",
                0, settings.T6D_TELL_Y, settings.EQ_SCALE, MUTED),
            txt("the square root bends them, so the edge curls instead",
                0, settings.T6D_TELL_Y - settings.T6D_TELL_DY, settings.EQ_SCALE, MUTED))
        for one in told:
            self.play(FadeIn(one), run_time=settings.FAST)
        self.wait(0.8)
        note = common.top_note("the dragon is not a Julia set, and no Julia set is a dragon curve")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)
