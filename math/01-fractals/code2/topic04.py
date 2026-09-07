import numpy as np
from manim import (
    Scene, DashedLine, Dot, Line, VGroup, Rectangle, Polygon,
    Create, FadeIn, FadeOut, Transform, ReplacementTransform, TransformFromCopy,
    Indicate, LaggedStart, rotate_vector,
    DEGREES, OUT, RIGHT, UP, DOWN,
)

import settings
import common
from common import BLUE_C, GOLD_C, GREEN_C, CORAL_C, INK, MUTED, caption, poly, txt

LEVELS = settings.T4_LEVELS


def koch_seg(a, b, level):
    if level == 0:
        return [a]
    d = (b - a) / 3
    p1 = a + d
    p2 = p1 + rotate_vector(d, 60 * DEGREES, OUT)
    p3 = a + 2 * d
    return (koch_seg(a, p1, level - 1) + koch_seg(p1, p2, level - 1)
            + koch_seg(p2, p3, level - 1) + koch_seg(p3, b, level - 1))


def koch_pts(a, b, level):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    return koch_seg(a, b, level) + [b]


def koch_span(span, y, level):
    return koch_pts([-span / 2, y, 0], [span / 2, y, 0], level)


def info_row(prefix, value, row, colour):
    return common.readout(prefix, value, settings.T4_INFO_X,
                          settings.T4_INFO_Y - row * settings.T4_INFO_DY, colour)


def pieces_value(level):
    return f"{4 ** level}"


def piecelen_value(level):
    return "1" if level == 0 else f"1/{3 ** level}"


class KochRule(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        span = settings.T4_SPAN
        y = settings.T4_Y

        cap = caption("one segment, one rule")
        base = poly(koch_span(span, y, 0), BLUE_C, settings.STROKE_MAIN)
        pieces = info_row("pieces:", pieces_value(0), 0, BLUE_C)
        plen = info_row("piece length:", piecelen_value(0), 1, GOLD_C)
        self.play(FadeIn(cap), Create(base))
        self.play(FadeIn(pieces), FadeIn(plen))
        self.wait(0.5)

        ra = np.array([-settings.T4_RULE_SPAN / 2, settings.T4_RULE_Y, 0])
        rb = np.array([settings.T4_RULE_SPAN / 2, settings.T4_RULE_Y, 0])
        rule = poly([ra, rb], MUTED, settings.STROKE_GRID + 1)
        third = settings.T4_RULE_SPAN / 3
        ticks = VGroup(*[
            Line(ra + RIGHT * third * k + DOWN * settings.T4_TICK_H,
                 ra + RIGHT * third * k + UP * settings.T4_TICK_H, color=GOLD_C)
            for k in (1, 2)
        ])
        third_lbl = txt("1/3", ra[0] + third / 2, settings.T4_RULE_Y - settings.T4_THIRD_DY,
                        settings.NAME_SCALE, GOLD_C)
        self.play(FadeIn(rule), Create(ticks), FadeIn(third_lbl))
        bumped = poly(koch_pts(ra, rb, 1), MUTED, settings.STROKE_GRID + 1)
        self.play(ReplacementTransform(rule, bumped), run_time=settings.SLOW)
        rule_note = txt("the middle third becomes a bump", 0,
                        settings.T4_RULE_Y - settings.T4_RULE_NOTE_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(rule_note))
        self.wait(0.5)

        cur = base
        runs = (settings.SLOW, settings.MID, settings.FAST, settings.FAST)
        for level in range(1, LEVELS + 1):
            nxt = poly(koch_span(span, y, level), BLUE_C,
                       settings.STROKE_MAIN if level == 1 else settings.STROKE_GRID + 2)
            self.play(
                ReplacementTransform(cur, nxt),
                Transform(pieces[1], common.value_like(pieces, pieces_value(level), BLUE_C)),
                Transform(plen[1], common.value_like(plen, piecelen_value(level), GOLD_C)),
                run_time=runs[level - 1],
            )
            cur = nxt
            if level == 1:
                self.play(Transform(cap, caption("the same rule, again and again")))
            self.wait(0.2)

        self.play(FadeOut(bumped), FadeOut(ticks), FadeOut(third_lbl), FadeOut(rule_note))
        pts = koch_span(span, y, LEVELS)
        snap = settings.T4_ZOOM_SNAP
        i0 = int(len(pts) * settings.T4_ZOOM_FRAC) // snap * snap
        target = np.array([settings.T4_ZOOM_TARGET[0], settings.T4_ZOOM_TARGET[1], 0])
        inset, src, dst = common.zoom_inset(pts, i0, i0 + settings.T4_ZOOM_SEGS, target,
                                            settings.T4_ZOOM_SIZE)
        links = VGroup(*[
            Line(src.get_corner(c), dst.get_corner(c), color=MUTED, stroke_width=1)
            for c in (UP + RIGHT, DOWN + RIGHT)
        ])
        self.play(Create(src))
        self.play(Create(dst), Create(links))
        self.play(TransformFromCopy(cur, inset), run_time=settings.MID)
        note = common.top_note("the same rule is there at every scale")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class KochCopies(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        level = settings.T4_COPY_LEVELS
        span = settings.T4_COPY_SPAN

        cap = caption("four quarters, each a third of the width")
        pts = koch_span(span, settings.T4_COPY_Y, level)
        whole = poly(pts, BLUE_C)
        self.play(FadeIn(cap), Create(whole))
        self.wait(0.5)

        q = 4 ** (level - 1)
        quarters = [pts[i * q:(i + 1) * q + 1] for i in range(4)]
        boxes = VGroup(*[common.frame_box(poly(p, BLUE_C), GOLD_C) for p in quarters])
        self.play(LaggedStart(*[Create(b) for b in boxes], lag_ratio=0.25), run_time=settings.MID)
        self.wait(0.5)

        ghost = poly(koch_span(settings.T4_GHOST_SPAN, settings.T4_GHOST_Y, level - 1), MUTED,
                     settings.STROKE_GRID)
        glbl = txt("one pass earlier", 0, settings.T4_GHOST_Y - settings.T4_GHOST_LBL_DY,
                   settings.NAME_SCALE, MUTED)
        self.play(FadeIn(ghost), FadeIn(glbl))
        for i in range(4):
            piece = poly(quarters[i], BLUE_C)
            self.add(piece)
            grown = piece.copy()
            grown.rotate(settings.T4_PIECE_ROT[i] * DEGREES)
            grown.scale(settings.T4_MAG)
            grown.move_to(ghost.get_center())
            self.play(Transform(piece, grown), Indicate(boxes[i], color=GOLD_C),
                      run_time=settings.MID if i == 0 else settings.FAST)
            self.wait(0.8 if i == 0 else 0.4)
            self.play(FadeOut(piece), run_time=settings.FAST)
        self.wait(0.5)

        sub = 4 ** (level - 2)
        subs = VGroup(*[
            common.frame_box(poly(quarters[0][j * sub:(j + 1) * sub + 1], BLUE_C), CORAL_C)
            for j in range(4)
        ])
        self.play(LaggedStart(*[Create(b) for b in subs], lag_ratio=0.25), run_time=settings.MID)
        note = common.top_note("every quarter splits into four again, without end")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class KochDim(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        d = float(np.log(4) / np.log(3))

        cap = caption("the copies and the scale give the dimension")
        copies = txt("4 copies", -settings.T4_DIM_DX, settings.T4_DIM_Y,
                     settings.FORMULA_SCALE, BLUE_C)
        factor = txt("scale 1/3", settings.T4_DIM_DX, settings.T4_DIM_Y,
                     settings.FORMULA_SCALE, GOLD_C)
        self.play(FadeIn(cap), FadeIn(copies), FadeIn(factor))
        self.wait(0.5)

        rel = txt("d = log 4 / log 3", 0, settings.T4_REL_Y, settings.FORMULA_SCALE, INK,
                  [(0, 1, GREEN_C), (5, 6, BLUE_C), (10, 11, GOLD_C)])
        self.play(FadeIn(rel[0:5]))
        self.play(TransformFromCopy(copies[0:1], rel[5:6]))
        self.play(FadeIn(rel[6:10]))
        self.play(TransformFromCopy(factor[7:8], rel[10:11]))
        self.remove(rel[0:5], rel[5:6], rel[6:10], rel[10:11])
        self.add(rel)
        value = txt(f"≈ {d:.3f}", 0, settings.T4_REL_Y - settings.T4_VAL_DY,
                    settings.FORMULA_SCALE, GREEN_C)
        self.play(FadeIn(value))
        self.wait(0.5)

        sc = common.Scale1to2()
        self.play(Create(sc.build()))
        koch_mark = sc.mark(d, f"Koch curve {d:.3f}", GREEN_C, True)
        coast_mark = sc.mark(settings.T4_COAST_D, f"measured coast {settings.T4_COAST_D}",
                             BLUE_C, False)
        self.play(Indicate(value, color=GREEN_C), FadeIn(koch_mark))
        self.play(FadeIn(coast_mark), FadeOut(cap))
        self.play(Indicate(koch_mark[2], color=GREEN_C), Indicate(coast_mark[2], color=BLUE_C))
        note = common.top_note("the idealised curve lands where the real coast was measured")
        self.play(FadeIn(note))
        self.wait(1)


class KochLength(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        span = settings.T4_LEN_SPAN
        y = settings.T4_LEN_Y
        shift = RIGHT * settings.T4_LEN_X

        cap = caption("the length climbs, the box does not")
        base = [p + shift for p in koch_span(span, y, 0)]
        curve = poly(base, BLUE_C, settings.STROKE_MAIN)
        top = span / 3 * np.sqrt(3) / 2
        frame = Rectangle(width=span * settings.T4_FRAME_W, height=top * settings.T4_FRAME_H,
                          color=MUTED, stroke_width=settings.STROKE_GRID)
        frame.move_to([settings.T4_LEN_X, y + top * settings.T4_FRAME_H / 2, 0])
        self.play(FadeIn(cap), Create(curve), Create(frame))

        read = common.readout("length:", f"{common.path_len(base):.2f}", settings.T4_READ_X,
                              settings.T4_READ_Y, BLUE_C)
        self.play(FadeIn(read))
        self.wait(0.5)

        cur = curve
        for level in range(1, LEVELS + 2):
            pts = [p + shift for p in koch_span(span, y, level)]
            nxt = poly(pts, BLUE_C, settings.STROKE_GRID + 2)
            total = common.path_len(pts)
            row = txt(f"× 4/3 → {total:.2f}", settings.T4_READ_X,
                      settings.T4_READ_Y - level * settings.T4_READ_DY,
                      settings.NAME_SCALE, CORAL_C)
            self.play(
                ReplacementTransform(cur, nxt), FadeIn(row), Indicate(frame, color=MUTED),
                Transform(read[1], common.value_like(read, f"{total:.2f}", BLUE_C)),
                run_time=settings.SLOW if level == 1 else settings.FAST,
            )
            cur = nxt
        note = common.top_note("unbounded length inside a fixed box")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


def snow_pts(radius, centre, level):
    corners = [
        np.array([centre[0] + radius * np.cos(a), centre[1] + radius * np.sin(a), 0])
        for a in (np.pi / 2, np.pi / 2 - 2 * np.pi / 3, np.pi / 2 - 4 * np.pi / 3)
    ]
    out = []
    for p, q in zip(corners, corners[1:] + corners[:1]):
        out += koch_pts(p, q, level)[:-1]
    return out


def snow_shape(pts, width):
    s = Polygon(*pts, color=BLUE_C, stroke_width=width)
    s.set_fill(BLUE_C, opacity=settings.T4_FILL)
    return s


class KochSnowflake(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        centre = (settings.T4_SNOW_X, settings.T4_SNOW_Y)
        r = settings.T4_SNOW_R

        cap = caption("perimeter without bound, area that settles")
        pts = snow_pts(r, centre, 0)
        shape = snow_shape(pts, settings.STROKE_MAIN)
        self.play(FadeIn(cap), Create(shape))

        a0 = common.shoelace(pts)
        per = common.readout("perimeter:", f"{common.path_len(pts + [pts[0]]):.2f}",
                             settings.T4_READ_X, settings.T4_READ_Y, CORAL_C)
        area = common.readout("area:", "1.000", settings.T4_READ_X,
                              settings.T4_READ_Y - settings.T4_AREA_DY, GREEN_C)
        unit = txt("area in starting triangles", settings.T4_READ_X,
                   settings.T4_READ_Y - settings.T4_UNIT_DY, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(per), FadeIn(area), FadeIn(unit))
        self.wait(0.5)

        cur = shape
        areas = [1.0]
        for level in range(1, settings.T4_SNOW_LEVELS + 1):
            pts = snow_pts(r, centre, level)
            nxt = snow_shape(pts, settings.STROKE_GRID + 2)
            new_per = common.value_like(per, f"{common.path_len(pts + [pts[0]]):.2f}", CORAL_C)
            ratio = common.shoelace(pts) / a0
            areas.append(ratio)
            new_area = common.value_like(area, f"{ratio:.3f}", GREEN_C)
            self.play(
                ReplacementTransform(cur, nxt), Transform(per[1], new_per),
                Transform(area[1], new_area),
                run_time=settings.SLOW if level == 1 else settings.MID,
            )
            cur = nxt
            self.wait(0.2)

        ox = settings.T4_CONV_X - settings.T4_CONV_W / 2
        oy = settings.T4_CONV_Y

        def conv_at(step, value):
            fx = step / settings.T4_SNOW_LEVELS
            fy = ((value - settings.T4_CONV_LO)
                  / (settings.T4_CONV_HI - settings.T4_CONV_LO))
            return np.array([ox + fx * settings.T4_CONV_W, oy + fy * settings.T4_CONV_H, 0])

        axes = VGroup(
            Line([ox, oy, 0], [ox + settings.T4_CONV_W, oy, 0], color=MUTED,
                 stroke_width=settings.STROKE_GRID),
            Line([ox, oy, 0], [ox, oy + settings.T4_CONV_H, 0], color=MUTED,
                 stroke_width=settings.STROKE_GRID),
            txt("passes", settings.T4_CONV_X, oy - 0.3, settings.AXLBL_SCALE, MUTED),
            txt("area", ox - 0.45, oy + settings.T4_CONV_H / 2, settings.AXLBL_SCALE, MUTED),
        )
        limit_line = DashedLine(conv_at(0, settings.T4_LIMIT),
                                conv_at(settings.T4_SNOW_LEVELS, settings.T4_LIMIT),
                                color=GREEN_C, stroke_width=settings.STROKE_GRID)
        limit_lbl = txt("8/5", ox - 0.3, conv_at(0, settings.T4_LIMIT)[1],
                        settings.NAME_SCALE, GREEN_C)
        self.play(Create(axes), Create(limit_line), FadeIn(limit_lbl))
        marks = VGroup(*[Dot(conv_at(i, a), color=GREEN_C, radius=settings.SCALE_DOT_R)
                         for i, a in enumerate(areas)])
        track = poly([conv_at(i, a) for i, a in enumerate(areas)], GREEN_C,
                     settings.STROKE_GRID)
        self.play(LaggedStart(*[FadeIn(m) for m in marks], lag_ratio=0.2),
                  Create(track), run_time=settings.SLOW)
        climb = txt("perimeter has no limit", settings.T4_SNOW_X, settings.T4_CLIMB_Y,
                    settings.EQ_SCALE, CORAL_C)
        self.play(FadeIn(climb))
        note = common.top_note("a finite area with a boundary of no finite length")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)
