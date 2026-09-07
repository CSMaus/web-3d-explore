import numpy as np
from manim import (
    Scene, DashedLine, Dot, Line, Rectangle, VGroup,
    Create, FadeIn, FadeOut, Indicate, LaggedStart, MoveAlongPath, Transform,
)

import settings
import common
import topic09
from common import BLUE_C, GOLD_C, GREEN_C, CORAL_C, MUTED, caption, poly, txt


def set_mask(extent, n, iters):
    x0, x1, y0, y1 = extent
    xs = np.linspace(x0, x1, n)
    ys = np.linspace(y1, y0, n)
    c = xs[None, :] + 1j * ys[:, None]
    z = np.zeros_like(c)
    alive = np.ones(c.shape, dtype=bool)
    for _ in range(iters):
        z[alive] = z[alive] ** 2 + c[alive]
        alive &= np.abs(z) <= settings.T9_RADIUS
    return alive


def edge_boxes(mask, size):
    m = mask[:mask.shape[0] // size * size, :mask.shape[1] // size * size]
    b = m.reshape(m.shape[0] // size, size, m.shape[1] // size, size)
    return int((b.any(axis=(1, 3)) & (~b).any(axis=(1, 3))).sum())


def c_to_screen(c, extent, box):
    x0, x1, y0, y1 = extent
    return np.array([box[0] + (c[0] - x0) / (x1 - x0) * (box[1] - box[0]),
                     box[2] + (c[1] - y0) / (y1 - y0) * (box[3] - box[2]), 0])


def cardioid(theta):
    m = np.exp(1j * theta)
    c = m / 2 - m * m / 4
    return (c.real, c.imag)


class Connectedness(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        box = topic09.screen_box(settings.T10_MAND, settings.T10_SET_H,
                                 (settings.T10_SET_X, settings.T10_SET_Y))

        cap = caption("inside gives one piece, outside gives dust")
        body = topic09.flat_set_image(settings.T10_MAND, box)
        self.play(FadeIn(cap), FadeIn(body))
        self.wait(0.3)

        for pair in range(2):
            shown = VGroup()
            imgs = []
            for c, sign, tag, colour in (
                    (settings.T10_IN_CS[pair], 1, "one connected piece", GREEN_C),
                    (settings.T10_OUT_CS[pair], -1, "scattered dust", CORAL_C)):
                jbox = topic09.screen_box(settings.T9_JULIA, settings.T10_INS_H,
                                          (settings.T10_INS_X, sign * settings.T10_INS_Y))
                p = c_to_screen(c, settings.T10_MAND, box)
                mark = Dot(p, color=colour, radius=settings.T8_DOT_R)
                link = Line(p, [jbox[0], (jbox[2] + jbox[3]) / 2, 0], color=MUTED,
                            stroke_width=1)
                small = topic09.julia_image(c, settings.T9_JULIA, jbox)
                edge = Rectangle(width=jbox[1] - jbox[0], height=jbox[3] - jbox[2],
                                 color=colour, stroke_width=settings.STROKE_GRID)
                edge.move_to([(jbox[0] + jbox[1]) / 2, (jbox[2] + jbox[3]) / 2, 0])
                lbl = txt(tag, (jbox[0] + jbox[1]) / 2, jbox[2] - 0.3, settings.NAME_SCALE,
                          colour)
                self.play(FadeIn(mark), Create(link), run_time=settings.FAST)
                self.play(FadeIn(small), Create(edge), FadeIn(lbl), run_time=settings.MID)
                shown.add(mark, link, edge, lbl)
                imgs.append(small)
            self.wait(0.6)
            if pair == 0:
                self.play(Transform(cap, caption("two more values of c, the same answer")))
                self.play(FadeOut(shown), *[FadeOut(m) for m in imgs], run_time=settings.FAST)
        rule = txt("this map records which Julia sets hold together", 0, settings.T10_RULE_Y,
                   settings.EQ_SCALE, MUTED)
        self.play(FadeIn(rule), FadeOut(cap))
        note = common.top_note("one picture answers the question for every c at once")
        self.play(FadeIn(note))
        self.wait(1)


class BoundaryDetail(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        box = topic09.screen_box(settings.T10_MAND, settings.T10_SET_H,
                                 (settings.T10_SET_X, settings.T10_SET_Y))

        cap = caption("the inside is plain, the outside is plain")
        full = topic09.mandel_image(settings.T10_MAND, box)
        self.play(FadeIn(cap), FadeIn(full), run_time=settings.MID)
        self.wait(0.5)

        c = topic09.cgrid(settings.T10_MAND, settings.T9_PX)
        counts = topic09.escape_counts(np.zeros_like(c), c, settings.T9_ITERS,
                                       settings.T9_RADIUS)
        frac = np.clip(counts.astype(float) / settings.T9_ITERS, 0, 1) ** settings.T9_GAMMA
        lo, hi = settings.T10_BAND
        band = (counts >= 0) & (frac >= lo) & (frac <= hi)
        arr = np.zeros((counts.shape[0], counts.shape[1], 4), dtype=np.uint8)
        arr[..., :3] = topic09.RAMP[(frac * (settings.T9_BANDS - 1)).astype(int)]
        arr[..., 3] = np.where(band, 255, 0)
        ring = common.image_at(arr, box)
        dim = topic09.mandel_image(settings.T10_MAND, box)
        dim.set_opacity(settings.T10_DIM_ALPHA / 255)
        self.play(FadeIn(dim), FadeOut(full), run_time=settings.MID)
        self.play(FadeIn(ring), run_time=settings.MID)
        lbl = txt("all of the detail sits on the edge", settings.T10_READ_X,
                  settings.T10_READ_Y, settings.EQ_SCALE, GOLD_C)
        self.play(FadeIn(lbl))
        self.wait(0.5)

        thetas = np.linspace(0, 2 * np.pi, settings.T10_WALK_N)
        path = poly([c_to_screen(cardioid(t), settings.T10_MAND, box) for t in thetas],
                    GOLD_C, 1)
        runner = Dot(path.get_start(), color=GOLD_C, radius=settings.T8_DOT_R)
        self.play(FadeIn(runner))
        self.play(Transform(cap, caption("the edge of the main body, traced exactly")))
        self.play(MoveAlongPath(runner, path), Create(path), run_time=settings.SLOW * 2)
        note = common.top_note("smooth here, and anything but smooth where the bulbs meet it")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class EndlessZoom(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        centre = settings.T10_ZOOM_C
        box = topic09.screen_box((-1.0, 1.0, -1.0, 1.0), settings.T10_ZOOM_H,
                                 (settings.T10_ZOOM_X, settings.T10_ZOOM_Y))

        cap = caption("dive into the edge and it never smooths out")
        read = common.readout("magnified:", "1", settings.T10_READ_X, settings.T10_READ_Y, GOLD_C)
        shown = None
        for k in range(settings.T10_ZOOM_LEVELS):
            w = settings.T10_ZOOM_W0 / settings.T10_ZOOM_K ** k
            extent = (centre[0] - w, centre[0] + w, centre[1] - w, centre[1] + w)
            iters = settings.T10_ZOOM_ITERS0 + settings.T10_ZOOM_DITERS * k
            img = topic09.mandel_image(extent, box, iters)
            factor = settings.T10_ZOOM_K ** k
            if shown is None:
                self.play(FadeIn(cap), FadeIn(img), FadeIn(read), run_time=settings.MID)
            else:
                grow = shown.copy()
                grow.scale(settings.T10_DIVE_GROW)
                grow.set_opacity(0)
                self.play(
                    Transform(shown, grow), FadeIn(img),
                    Transform(read[1], common.value_like(read, f"{factor:.0f}", GOLD_C)),
                    run_time=settings.MID,
                )
                self.remove(shown)
            shown = img
            self.wait(0.3)
        note = common.top_note("new structure at every scale, without end")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)


class BoundaryDimension(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        box = topic09.screen_box(settings.T10_MAND, settings.T10_SET_H,
                                 (settings.T10_SET_X, settings.T10_SET_Y))

        cap = caption("count the boxes the edge passes through")
        body = topic09.flat_set_image(settings.T10_MAND, box)
        self.play(FadeIn(cap), FadeIn(body))

        rows = []
        values = []
        for i, (n, iters) in enumerate(settings.T10_RES):
            mask = set_mask(settings.T10_MAND, n, iters)
            scale = n // settings.T10_RES[0][0]
            sizes = [m * scale for m in settings.T10_BOX_MUL]
            counts = [edge_boxes(mask, s) for s in sizes]
            d = -np.polyfit(np.log(sizes), np.log(counts), 1)[0]
            values.append(float(d))
            row = txt(f"{n} across  →  {d:.3f}", settings.T10_READ_X,
                      settings.T10_READ_Y - i * settings.T10_READ_DY, settings.EQ_SCALE, MUTED,
                      [(0, len(str(n)), GOLD_C), (len(str(n)) + 7, 40, GREEN_C)])
            rows.append(row)
            self.play(FadeIn(row), run_time=settings.FAST)
            self.wait(0.3)
        climb = txt("finer pictures, higher numbers", settings.T10_READ_X,
                    settings.T10_READ_Y - len(rows) * settings.T10_READ_DY,
                    settings.NAME_SCALE, MUTED)
        self.play(FadeIn(climb), Indicate(VGroup(*rows), color=GREEN_C))
        self.wait(0.5)

        sc = common.Scale1to2(y=settings.T10_SCALE_Y)
        self.play(Create(sc.build()), FadeOut(cap))
        marks = VGroup(
            sc.mark(float(np.log(4) / np.log(3)), "Koch curve", BLUE_C, True),
            sc.mark(values[-1], "measured here", GOLD_C, False),
            sc.mark(2.0, "proved value", GREEN_C, True),
        )
        self.play(LaggedStart(*[FadeIn(m) for m in marks], lag_ratio=0.3), run_time=settings.MID)
        thm = txt(settings.T10_THEOREM, 0, settings.T10_THM_Y, settings.NAME_SCALE, GREEN_C)
        self.play(FadeIn(thm))
        note = common.top_note("no finite picture reaches the limit, the proof does")
        self.play(FadeIn(note))
        self.wait(1)


def bifurcation(px, warm, keep):
    cs = np.linspace(settings.T10_M2[0], settings.T10_M2[1], px)
    x = np.zeros_like(cs)
    for _ in range(warm):
        x = x * x + cs
        x = np.where(np.abs(x) > settings.T10_BIF_YR, np.nan, x)
    pts = []
    for _ in range(keep):
        x = x * x + cs
        x = np.where(np.abs(x) > settings.T10_BIF_YR, np.nan, x)
        good = ~np.isnan(x)
        pts.append(np.stack([cs[good], x[good]], axis=1))
    return np.concatenate(pts, axis=0)


class PeriodDoubling(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        x0, x1, y0, y1 = settings.T10_M2
        w = settings.T10_M2_W
        h = w * (y1 - y0) / (x1 - x0)
        mbox = (-w / 2, w / 2, settings.T10_M2_Y - h / 2, settings.T10_M2_Y + h / 2)
        bbox = (-w / 2, w / 2, settings.T10_BIF_Y - settings.T10_BIF_H / 2,
                settings.T10_BIF_Y + settings.T10_BIF_H / 2)

        cap = caption("the bulbs along the real axis are the doublings")
        top = topic09.mandel_image(settings.T10_M2, mbox)
        self.play(FadeIn(cap), FadeIn(top), run_time=settings.MID)
        self.wait(0.3)

        pts = bifurcation(settings.T10_BIF_PX, settings.T10_BIF_WARM, settings.T10_BIF_KEEP)
        scr = np.empty_like(pts)
        scr[:, 0] = bbox[0] + (pts[:, 0] - x0) / (x1 - x0) * (bbox[1] - bbox[0])
        scr[:, 1] = ((bbox[2] + bbox[3]) / 2
                     + pts[:, 1] / (2 * settings.T10_BIF_YR) * (bbox[3] - bbox[2]))
        cols = np.tile(common.rgb(settings.ACCENT_STRUCTURE), (len(scr), 1))
        diagram = common.image_at(common.raster(scr, cols, bbox, dot=2), bbox)
        axis_lbl = txt("the real line only", settings.T10_AXIS_LBL_X,
                       (mbox[2] + bbox[3]) / 2, settings.NAME_SCALE, MUTED)
        self.play(FadeIn(diagram), run_time=settings.MID)
        self.play(FadeIn(axis_lbl))
        self.wait(0.5)

        links = VGroup()
        for cv in settings.T10_DOUBLE_CS:
            sx = bbox[0] + (cv - x0) / (x1 - x0) * (bbox[1] - bbox[0])
            links.add(DashedLine([sx, mbox[2] + settings.T10_LINK_UP, 0],
                                 [sx, bbox[2], 0], color=GOLD_C,
                                 stroke_width=settings.STROKE_GRID))
            links.add(txt(f"{cv:g}", sx + settings.T10_LINK_DX,
                          (mbox[2] + bbox[3]) / 2, settings.NAME_SCALE, GOLD_C))
        self.play(LaggedStart(*[Create(m) if isinstance(m, DashedLine) else FadeIn(m)
                                for m in links], lag_ratio=0.2), run_time=settings.MID)
        self.play(Transform(cap, caption("each bulb is one doubling of the period")))
        self.wait(0.6)
        note = common.top_note("the route to chaos, sitting inside this picture")
        self.play(FadeIn(note), FadeOut(cap))
        self.wait(1)
