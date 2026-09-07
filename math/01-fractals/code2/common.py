import numpy as np
from manim import (
    Text, VMobject, VGroup, Line, Dot, Rectangle, SurroundingRectangle, ImageMobject,
    Cube, interpolate_color, ManimColor, rotate_vector,
    DEGREES, ORIGIN, DOWN, LEFT, RIGHT, UP,
)

import settings

BG = settings.BACKGROUND
INK = settings.INK
MUTED = settings.MUTED
BLUE_C = settings.ACCENT_STRUCTURE
GOLD_C = settings.ACCENT_MATH
GREEN_C = settings.ACCENT_STABLE
CORAL_C = settings.ACCENT_CONTRAST


LIGHT = np.array(settings.LIGHT_DIR, dtype=float)
LIGHT = LIGHT / np.linalg.norm(LIGHT)
DARK = ManimColor(settings.CUBE_DARK)
BRIGHT = ManimColor(settings.CUBE_LIGHT)


def face_out(f, centre):
    pts = f.get_vertices()
    normal = np.cross(pts[1] - pts[0], pts[2] - pts[0])
    normal = normal / np.linalg.norm(normal)
    if np.dot(normal, f.get_center() - centre) < 0:
        normal = -normal
    return normal


def shade_faces(c, dark=None, bright=None):
    centre = c.get_center()
    lo = ManimColor(dark) if dark else DARK
    hi = ManimColor(bright) if bright else BRIGHT
    out = []
    for f in c:
        normal = face_out(f, centre)
        if normal[2] <= 0:
            continue
        shade = settings.SHADE_MIN + (1 - settings.SHADE_MIN) * max(float(np.dot(normal, LIGHT)), 0)
        f.set_fill(interpolate_color(lo, hi, shade), opacity=1)
        f.set_stroke(settings.BACKGROUND, width=settings.STROKE_CUBE)
        out.append(f)
    return out


def tilt(m, tx=settings.TILT_X, ty=settings.TILT_Y):
    m.rotate(ty * DEGREES, axis=UP, about_point=ORIGIN)
    m.rotate(tx * DEGREES, axis=RIGHT, about_point=ORIGIN)
    return m


def tilt_vec(v, tx=settings.TILT_X, ty=settings.TILT_Y):
    w = rotate_vector(v, ty * DEGREES, UP)
    return rotate_vector(w, tx * DEGREES, RIGHT)


def solid(centres, side, tx=settings.TILT_X, ty=settings.TILT_Y, at=(0.0, 0.0),
          dark=None, bright=None):
    group = VGroup()
    for c in centres:
        cube = Cube(side_length=side)
        cube.move_to(np.asarray(c, dtype=float))
        group.add(cube)
    tilt(group, tx, ty)
    faces = [f for cube in group for f in shade_faces(cube, dark, bright)]
    faces.sort(key=lambda m: m.get_center()[2])
    return VGroup(*faces).shift([at[0], at[1], 0])


def dim_text(n, m, x, y, scale=settings.FORMULA_SCALE):
    value = float(np.log(n) / np.log(m))
    ns, ms = str(n), str(m)
    body = f"d = log {ns} / log {ms} \u2248 {value:.3f}"
    i0 = 5
    i1 = i0 + len(ns)
    j0 = i1 + 4
    j1 = j0 + len(ms)
    spec = [(0, 1, GREEN_C), (i0, i1, BLUE_C), (j0, j1, GOLD_C), (j1 + 1, 99, GREEN_C)]
    return txt(body, x, y, scale, INK, spec), value


def rgb(value):
    h = value.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.uint8)


def hexof(values):
    r, g, b = (int(v) for v in values[:3])
    return f"#{r:02X}{g:02X}{b:02X}"


def ramp(stops, n):
    cols = np.array([rgb(h) for h in stops], dtype=float)
    idx = np.linspace(0, len(cols) - 1, n)
    lo = np.floor(idx).astype(int)
    hi = np.minimum(lo + 1, len(cols) - 1)
    t = (idx - lo).reshape(-1, 1)
    return (cols[lo] * (1 - t) + cols[hi] * t).astype(np.uint8)


def raster(pts, cols, extent, ppu=settings.RASTER_PPU, dot=settings.RASTER_DOT):
    x0, x1, y0, y1 = extent
    w = max(2, int((x1 - x0) * ppu))
    h = max(2, int((y1 - y0) * ppu))
    img = np.zeros((h, w, 4), dtype=np.uint8)
    ix = ((pts[:, 0] - x0) / (x1 - x0) * (w - 1)).astype(int)
    iy = ((y1 - pts[:, 1]) / (y1 - y0) * (h - 1)).astype(int)
    keep = (ix >= 0) & (ix < w) & (iy >= 0) & (iy < h)
    ix, iy, cc = ix[keep], iy[keep], cols[keep]
    for du in range(dot):
        for dv in range(dot):
            xx = np.clip(ix + du, 0, w - 1)
            yy = np.clip(iy + dv, 0, h - 1)
            img[yy, xx, :3] = cc
            img[yy, xx, 3] = 255
    return img


def image_at(arr, extent):
    x0, x1, y0, y1 = extent
    m = ImageMobject(arr)
    m.stretch_to_fit_width(x1 - x0)
    m.stretch_to_fit_height(y1 - y0)
    m.move_to([(x0 + x1) / 2, (y0 + y1) / 2, 0])
    return m


def paint(t, spec):
    for a, b, colour in spec:
        t[a:b].set_color(colour)
    return t


def txt(value, x, y, scale=settings.EQ_SCALE, colour=INK, spec=()):
    t = Text(value, color=colour).scale(scale).move_to([x, y, 0])
    return paint(t, spec)


def caption(value):
    return Text(value, color=MUTED).scale(settings.CAPTION_SCALE).to_edge(DOWN)


def top_note(value):
    t = Text(value, color=MUTED).scale(settings.CAPTION_SCALE)
    return t.move_to([0, settings.NOTE2_Y, 0])


def line_of(parts, x, y, scale=settings.EQ_SCALE, buff=settings.PIECE_BUFF, left=True):
    group = VGroup()
    for body, colour in parts:
        piece = Text(body, color=colour).scale(scale)
        if len(group) == 0:
            piece.move_to([x, y, 0], aligned_edge=LEFT if left else ORIGIN)
        else:
            piece.next_to(group[-1], RIGHT, buff=buff)
            piece.set_y(y)
        group.add(piece)
    return group


def readout(prefix, value, x, y, colour, scale=settings.EQ_SCALE):
    head = Text(prefix, color=MUTED).scale(scale)
    head.move_to([x, y, 0], aligned_edge=LEFT)
    body = Text(value, color=colour).scale(scale)
    body.next_to(head, RIGHT, buff=settings.READ_BUFF)
    return VGroup(head, body)


def value_like(group, value, colour, scale=settings.EQ_SCALE):
    body = Text(value, color=colour).scale(scale)
    body.next_to(group[0], RIGHT, buff=settings.READ_BUFF)
    return body


def poly(pts, colour=BLUE_C, width=settings.STROKE_GRID + 2):
    m = VMobject(color=colour, stroke_width=width)
    m.set_points_as_corners([np.asarray(p, dtype=float) for p in pts])
    return m


def dense_pts(corners, per_seg):
    out = []
    for p, q in zip(corners, corners[1:]):
        for t in np.linspace(0, 1, per_seg, endpoint=False):
            out.append(p + (q - p) * t)
    out.append(corners[-1])
    return out


def chord_walk(pts, step):
    anchors = [pts[0]]
    cur = pts[0]
    for p in pts[1:]:
        if np.linalg.norm(p - cur) >= step:
            anchors.append(p)
            cur = p
    anchors.append(pts[-1])
    total = sum(float(np.linalg.norm(q - p)) for p, q in zip(anchors, anchors[1:]))
    return anchors, total


def path_len(pts):
    return sum(float(np.linalg.norm(np.asarray(q) - np.asarray(p))) for p, q in zip(pts, pts[1:]))


def shoelace(pts):
    a = 0.0
    for p, q in zip(pts, list(pts[1:]) + [pts[0]]):
        a += float(p[0] * q[1] - q[0] * p[1])
    return abs(a) / 2


class Scale1to2:
    def __init__(self, lo=settings.SCALE_LO, hi=settings.SCALE_HI, y=settings.SCALE_Y,
                 length=settings.SCALE_LEN, x=0.0):
        self.lo = lo
        self.hi = hi
        self.y = y
        self.length = length
        self.x = x

    def at(self, v):
        f = (v - self.lo) / (self.hi - self.lo)
        return np.array([self.x - self.length / 2 + f * self.length, self.y, 0])

    def build(self):
        axis = Line(self.at(self.lo), self.at(self.hi), color=INK, stroke_width=settings.STROKE_GRID)
        g = VGroup(axis)
        for v in range(int(self.lo), int(self.hi) + 1):
            p = self.at(v)
            g.add(Line(p + DOWN * settings.SCALE_TICK, p + UP * settings.SCALE_TICK, color=INK))
            g.add(txt(str(v), p[0], p[1] - settings.SCALE_LBL_DY, settings.FRAC_SCALE, INK))
        return g

    def mark(self, v, label, colour=GREEN_C, up=True):
        p = self.at(v)
        sign = 1 if up else -1
        needle = Line(p, p + UP * sign * settings.SCALE_NEEDLE, color=colour,
                      stroke_width=settings.STROKE_GRID + 1)
        dot = Dot(p, color=colour, radius=settings.SCALE_DOT_R)
        lb = txt(label, p[0], p[1] + sign * (settings.SCALE_NEEDLE + settings.SCALE_MARK_DY),
                 settings.NAME_SCALE, colour)
        return VGroup(needle, dot, lb)


class LogLog:
    def __init__(self, x, y, w=settings.LL_W, h=settings.LL_H,
                 xlabel="ruler size", ylabel="measured length"):
        self.ox = x - w / 2
        self.oy = y
        self.w = w
        self.h = h
        self.xlabel = xlabel
        self.ylabel = ylabel
        self.xr = None
        self.yr = None

    def fit(self, xs, ys):
        lx = np.log(np.asarray(xs, dtype=float))
        ly = np.log(np.asarray(ys, dtype=float))
        pad = settings.LL_PAD
        self.xr = (lx.min() - pad, lx.max() + pad)
        self.yr = (ly.min() - pad, ly.max() + pad)
        slope, inter = np.polyfit(lx, ly, 1)
        return float(slope), float(inter)

    def at(self, xv, yv):
        fx = (np.log(xv) - self.xr[0]) / (self.xr[1] - self.xr[0])
        fy = (np.log(yv) - self.yr[0]) / (self.yr[1] - self.yr[0])
        return np.array([self.ox + fx * self.w, self.oy + fy * self.h, 0])

    def build(self):
        ax = Line([self.ox, self.oy, 0], [self.ox + self.w, self.oy, 0],
                  color=MUTED, stroke_width=settings.STROKE_GRID)
        ay = Line([self.ox, self.oy, 0], [self.ox, self.oy + self.h, 0],
                  color=MUTED, stroke_width=settings.STROKE_GRID)
        xl = Text(self.xlabel, color=MUTED).scale(settings.AXLBL_SCALE).next_to(ax, DOWN, buff=0.1)
        yl = Text(self.ylabel, color=MUTED).scale(settings.AXLBL_SCALE)
        yl.rotate(90 * DEGREES).next_to(ay, LEFT, buff=0.1)
        return VGroup(ax, ay, xl, yl)

    def dots(self, xs, ys, colour=GOLD_C):
        return VGroup(*[Dot(self.at(a, b), color=colour, radius=settings.LL_DOT_R)
                        for a, b in zip(xs, ys)])

    def fit_line(self, xs, slope, inter, colour=GREEN_C):
        a, b = min(xs), max(xs)
        p = self.at(a, float(np.exp(slope * np.log(a) + inter)))
        q = self.at(b, float(np.exp(slope * np.log(b) + inter)))
        return Line(p, q, color=colour, stroke_width=settings.STROKE_GRID + 1)


def fit_box(m, w, h, centre):
    m.scale_to_fit_height(h)
    if m.width > w:
        m.scale_to_fit_width(w)
    m.move_to([centre[0], centre[1], 0])
    return m


def frame_box(mob, colour=MUTED, pad=settings.FRAME_PAD):
    return SurroundingRectangle(mob, color=colour, buff=pad, stroke_width=settings.STROKE_GRID)


def zoom_inset(pts, i0, i1, target, size, colour=BLUE_C):
    sel = [np.asarray(p, dtype=float) for p in pts[i0:i1 + 1]]
    xs = [p[0] for p in sel]
    ys = [p[1] for p in sel]
    w = max(xs) - min(xs)
    h = max(ys) - min(ys)
    c = np.array([(min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, 0])
    k = size / max(w, h)
    src = Rectangle(width=w, height=h, color=MUTED, stroke_width=settings.STROKE_GRID)
    src.move_to(c)
    dst = Rectangle(width=w * k, height=h * k, color=MUTED, stroke_width=settings.STROKE_GRID)
    dst.move_to(target)
    moved = [np.array([target[0] + (p[0] - c[0]) * k, target[1] + (p[1] - c[1]) * k, 0]) for p in sel]
    return poly(moved, colour), src, dst
