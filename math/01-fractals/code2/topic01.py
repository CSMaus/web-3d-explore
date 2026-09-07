from itertools import product

import numpy as np
from manim import (
    Scene, ThreeDScene, Dot, Line, Square, Cube, Prism, Rectangle, Polygon,
    Arrow, Text, VGroup, VMobject, DashedLine,
    GrowArrow, GrowFromPoint, GrowFromEdge, Create, Transform, FadeIn, FadeOut,
    ReplacementTransform, TransformFromCopy, LaggedStart, Indicate,
    interpolate_color, ManimColor, rotate_vector,
    DEGREES, ORIGIN, RIGHT, UP, OUT, IN, DOWN, LEFT,
)

import settings

LIGHT = np.array(settings.LIGHT_DIR, dtype=float)
LIGHT = LIGHT / np.linalg.norm(LIGHT)
DARK = ManimColor(settings.CUBE_DARK)
BRIGHT = ManimColor(settings.CUBE_LIGHT)
BLUE_C = settings.ACCENT_STRUCTURE
GOLD_C = settings.ACCENT_MATH
GREEN_C = settings.ACCENT_STABLE
CORAL_C = settings.ACCENT_CONTRAST


def face_out(f, centre):
    pts = f.get_vertices()
    normal = np.cross(pts[1] - pts[0], pts[2] - pts[0])
    normal = normal / np.linalg.norm(normal)
    if np.dot(normal, f.get_center() - centre) < 0:
        normal = -normal
    return normal


def shade_faces(c):
    centre = c.get_center()
    out = []
    for f in c:
        normal = face_out(f, centre)
        if normal[2] <= 0:
            continue
        shade = settings.SHADE_MIN + (1 - settings.SHADE_MIN) * max(float(np.dot(normal, LIGHT)), 0)
        f.set_fill(interpolate_color(DARK, BRIGHT, shade), opacity=1)
        f.set_stroke(settings.BACKGROUND, width=settings.STROKE_CUBE)
        out.append(f)
    return out


def tilt(m):
    m.rotate(settings.TILT_Y * DEGREES, axis=UP, about_point=ORIGIN)
    m.rotate(settings.TILT_X * DEGREES, axis=RIGHT, about_point=ORIGIN)
    return m


def tilt_vec(v):
    w = rotate_vector(v, settings.TILT_Y * DEGREES, UP)
    return rotate_vector(w, settings.TILT_X * DEGREES, RIGHT)


def box(w, h, d, x, size=None, y=None):
    s = size if size is not None else settings.SHAPE_SIZE
    yy = y if y is not None else settings.ROW_Y
    p = Prism(dimensions=[w * s, h * s, d * s])
    p.shift(np.array([(w - 1) * s / 2, (h - 1) * s / 2, (1 - d) * s / 2]))
    tilt(p)
    faces = shade_faces(p)
    faces.sort(key=lambda m: m.get_center()[2])
    return VGroup(*faces).shift([x, yy, 0])


def cube_frame(x, colour=GOLD_C, size=None, y=None):
    s = size if size is not None else settings.SHAPE_SIZE
    yy = y if y is not None else settings.ROW_Y
    c = Cube(side_length=s)
    tilt(c)
    centre = c.get_center()
    faces = [f for f in c if face_out(f, centre)[2] > 0]
    for f in faces:
        f.set_fill(colour, opacity=0)
        f.set_stroke(colour, width=settings.STROKE_FRAME)
    return VGroup(*faces).shift([x, yy, 0])


def line_sh(w, x, size=None, y=None):
    s = size if size is not None else settings.SHAPE_SIZE
    yy = y if y is not None else settings.ROW_Y
    l = Line(ORIGIN, RIGHT * w * s, color=BLUE_C, stroke_width=settings.STROKE_MAIN)
    l.move_to([x + (w - 1) * s / 2, yy, 0])
    return l


def rect_sh(w, h, x, size=None, y=None):
    s = size if size is not None else settings.SHAPE_SIZE
    yy = y if y is not None else settings.ROW_Y
    r = Rectangle(width=w * s, height=h * s)
    r.set_stroke(BLUE_C, width=settings.STROKE_GRID)
    r.set_fill(BLUE_C, opacity=0.25)
    r.move_to([x + (w - 1) * s / 2, yy + (h - 1) * s / 2, 0])
    return r


def small_cube(n, idx, fill):
    step = settings.SHAPE_SIZE / n
    i, j, k = idx
    c = Cube(side_length=step * fill)
    c.move_to((RIGHT * i + UP * j + OUT * k - (RIGHT + UP + OUT) * (n - 1) / 2) * step)
    return c


def grid_idx(n):
    return [t for t in product(range(n), repeat=3) if not (0 < t[0] < n - 1 and 0 < t[1] < n - 1 and 0 < t[2] < n - 1)]


def cube_grid(n, x, fill=settings.TILE_FILL):
    cubes = VGroup(*[small_cube(n, t, fill) for t in grid_idx(n)])
    tilt(cubes)
    faces = [f for c in cubes for f in shade_faces(c)]
    faces.sort(key=lambda m: m.get_center()[2])
    return VGroup(*faces).shift([x, settings.ROW_Y, 0])


def line_grid(n, x, fill=settings.TILE_FILL):
    step = settings.SHAPE_SIZE / n
    g = VGroup()
    for i in range(n):
        piece = Line(ORIGIN, RIGHT * step * fill, color=BLUE_C, stroke_width=settings.STROKE_MAIN)
        piece.move_to([x + (i - (n - 1) / 2) * step, settings.ROW_Y, 0])
        g.add(piece)
    return g


def sq_grid(n, x, fill=settings.TILE_FILL):
    step = settings.SHAPE_SIZE / n
    g = VGroup()
    for i, j in product(range(n), repeat=2):
        sq = Square(side_length=step * fill)
        sq.set_stroke(BLUE_C, width=settings.STROKE_GRID)
        sq.set_fill(BLUE_C, opacity=0.25)
        sq.move_to([x + (i - (n - 1) / 2) * step, settings.ROW_Y + (j - (n - 1) / 2) * step, 0])
        g.add(sq)
    return g


def flat_ruler(p1, p2):
    return Line(p1, p2, color=GOLD_C, stroke_width=settings.STROKE_MAIN + 2)


def edge_ruler(x, axis, size=None, y=None):
    s = size if size is not None else settings.SHAPE_SIZE
    yy = y if y is not None else settings.ROW_Y
    p0 = np.array([-s / 2, -s / 2, s / 2])
    e = Line(p0, p0 + axis * s, color=GOLD_C, stroke_width=settings.STROKE_MAIN + 2)
    tilt(e)
    return e.shift(np.array([x, yy, 0]))


def paint(t, spec):
    for a, b, colour in spec:
        t[a:b].set_color(colour)
    return t


def dim_txt(value, x):
    t = Text(value, color=GREEN_C).scale(settings.COUNT_SCALE)
    return t.move_to([x, settings.COUNT_Y, 0])


def cont_txt(value, x):
    t = Text(value, color=BLUE_C).scale(settings.COUNT_SCALE)
    return t.move_to([x, settings.CONT_Y, 0])


def name_txt(value, x):
    t = Text(value, color=settings.MUTED).scale(settings.NAME_SCALE)
    return t.move_to([x, settings.CONT_Y + settings.NAME_DY, 0])


def form_txt(value, x, spec):
    t = Text(value, color=settings.INK).scale(settings.EQ_SCALE).move_to([x, settings.EQ_Y, 0])
    return paint(t, spec)


def formula_txt(value, spec):
    t = Text(value, color=settings.INK).scale(settings.FORMULA_SCALE).move_to([0, settings.FORM_Y, 0])
    return paint(t, spec)


def caption_txt(value):
    t = Text(value, color=settings.MUTED).scale(settings.CAPTION_SCALE)
    return t.to_edge(DOWN)


class DimAsDirections(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        length = settings.DIR_LEN
        p0 = np.array([settings.DIR_P0[0], settings.DIR_P0[1], 0])
        cx = p0[0] + length / 2
        cy = p0[1] + length / 2

        caption = caption_txt("independent directions")
        count = dim_txt("0", 0)
        dot = Dot(p0, color=BLUE_C)
        self.play(FadeIn(caption), FadeIn(count))
        self.play(GrowFromPoint(dot, p0))
        self.wait(0.5)

        a_x = Arrow(p0, p0 + RIGHT * length, color=GOLD_C, buff=0)
        line = Line(p0, p0 + RIGHT * length, color=BLUE_C, stroke_width=settings.STROKE_MAIN)
        self.play(GrowArrow(a_x))
        self.play(GrowFromPoint(line, p0), run_time=settings.SLOW)
        self.play(Transform(count, dim_txt("1", 0)))
        self.wait(0.5)

        a_y = Arrow(p0, p0 + UP * length, color=GOLD_C, buff=0)
        rect = rect_sh(1, 1, cx, size=length, y=cy)
        self.play(GrowArrow(a_y))
        self.play(GrowFromEdge(rect, DOWN), run_time=settings.MID)
        self.play(Transform(count, dim_txt("2", 0)))
        self.wait(0.5)

        a_z = Arrow(p0, p0 + tilt_vec(OUT) * length, color=GOLD_C, buff=0)
        cube = box(1, 1, 1, cx, size=length, y=cy)
        self.play(GrowArrow(a_z))
        self.play(ReplacementTransform(rect, cube), FadeOut(line), FadeOut(dot), run_time=settings.MID)
        self.play(Transform(count, dim_txt("3", 0)))
        self.wait(0.5)

        r_x = edge_ruler(cx, RIGHT, size=length, y=cy)
        r_y = edge_ruler(cx, UP, size=length, y=cy)
        r_z = edge_ruler(cx, IN, size=length, y=cy)
        note = caption_txt("a ruler measures along each direction")
        self.play(
            FadeOut(a_x), FadeOut(a_y), FadeOut(a_z),
            Create(r_x), Create(r_y), Create(r_z),
            FadeOut(caption), FadeIn(note),
            run_time=settings.MID,
        )
        self.wait(1)


class DimAsScaling(ThreeDScene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        s = settings.SHAPE_SIZE

        caption = caption_txt("scale the size, watch the content")
        self.play(FadeIn(caption))

        pic = Rectangle(width=settings.ANCH_PIC_W, height=settings.ANCH_PIC_H)
        pic.set_stroke(BLUE_C, width=settings.STROKE_GRID)
        pic.set_fill(BLUE_C, opacity=0.25)
        pic.move_to([settings.ANCH_PIC_X, settings.ANCH_Y, 0])
        corner = pic.get_corner(DOWN + LEFT)
        hill = VMobject(color=settings.MUTED, stroke_width=settings.STROKE_GRID)
        hill.set_points_as_corners([
            corner + np.array([0.15, 0.15, 0]),
            corner + np.array([0.55, 0.7, 0]),
            corner + np.array([0.9, 0.3, 0]),
            corner + np.array([1.2, 0.55, 0]),
            corner + np.array([1.35, 0.15, 0]),
        ])
        sun = Dot(corner + np.array([1.15, 0.85, 0]), color=GOLD_C, radius=0.06)
        photo = VGroup(pic, hill, sun)
        acube = box(1, 1, 1, settings.ANCH_CUBE_X, size=settings.ANCH_CUBE_SIZE, y=settings.ANCH_Y)
        self.play(FadeIn(photo), FadeIn(acube))

        side2_p = Text("side × 2", color=GOLD_C).scale(settings.FRAC_SCALE)
        side2_p.move_to([settings.ANCH_PIC_X, settings.ANCH_FACT_Y, 0])
        side2_c = Text("side × 2", color=GOLD_C).scale(settings.FRAC_SCALE)
        side2_c.move_to([settings.ANCH_CUBE_X, settings.ANCH_FACT_Y, 0])
        self.play(
            photo.animate.scale(2, about_point=corner),
            FadeIn(side2_p),
            run_time=settings.SLOW,
        )
        gx = DashedLine(pic.get_edge_center(LEFT), pic.get_edge_center(RIGHT), color=settings.MUTED)
        gy = DashedLine(pic.get_edge_center(DOWN), pic.get_edge_center(UP), color=settings.MUTED)
        four = Text("paper × 4", color=BLUE_C).scale(settings.EQ_SCALE)
        four.move_to([settings.ANCH_PIC_X, settings.ANCH_WORD_Y, 0])
        self.play(Create(gx), Create(gy), FadeIn(four))
        acube2 = box(2, 2, 2, settings.ANCH_CUBE_X, size=settings.ANCH_CUBE_SIZE, y=settings.ANCH_Y)
        eight = Text("material × 8", color=BLUE_C).scale(settings.EQ_SCALE)
        eight.move_to([settings.ANCH_CUBE_X, settings.ANCH_WORD_Y, 0])
        self.play(ReplacementTransform(acube, acube2), FadeIn(side2_c), run_time=settings.SLOW)
        self.play(FadeIn(eight))
        self.wait(1)
        self.play(
            FadeOut(photo), FadeOut(gx), FadeOut(gy), FadeOut(four),
            FadeOut(acube2), FadeOut(eight), FadeOut(side2_p), FadeOut(side2_c),
        )

        line = line_sh(1, settings.X_LINE)
        square = rect_sh(1, 1, settings.X_SQ)
        cube = box(1, 1, 1, settings.X_CUBE)
        self.play(FadeIn(line), FadeIn(square), FadeIn(cube))

        y0 = settings.ROW_Y - s / 2
        x_sq0 = settings.X_SQ - s / 2
        r_line = flat_ruler(
            [settings.X_LINE - s / 2, settings.ROW_Y, 0],
            [settings.X_LINE + s / 2, settings.ROW_Y, 0],
        )
        d_l = dim_txt("1", settings.X_LINE)
        self.play(Create(r_line), FadeIn(d_l))
        r_sb = flat_ruler([x_sq0, y0, 0], [x_sq0 + s, y0, 0])
        d_s = dim_txt("1", settings.X_SQ)
        self.play(Create(r_sb), FadeIn(d_s))
        r_sl = flat_ruler([x_sq0, y0, 0], [x_sq0, y0 + s, 0])
        self.play(Create(r_sl), Transform(d_s, dim_txt("2", settings.X_SQ)))
        e_x = edge_ruler(settings.X_CUBE, RIGHT)
        d_c = dim_txt("1", settings.X_CUBE)
        self.play(Create(e_x), FadeIn(d_c))
        e_y = edge_ruler(settings.X_CUBE, UP)
        self.play(Create(e_y), Transform(d_c, dim_txt("2", settings.X_CUBE)))
        e_z = edge_ruler(settings.X_CUBE, IN)
        self.play(Create(e_z), Transform(d_c, dim_txt("3", settings.X_CUBE)))
        self.wait(0.5)

        cont_l = cont_txt("1", settings.X_LINE)
        cont_s = cont_txt("1", settings.X_SQ)
        cont_c = cont_txt("1", settings.X_CUBE)
        nm_l = name_txt("length", settings.X_LINE)
        nm_s = name_txt("area", settings.X_SQ)
        nm_c = name_txt("volume", settings.X_CUBE)
        self.play(
            FadeIn(cont_l), FadeIn(cont_s), FadeIn(cont_c),
            FadeIn(nm_l), FadeIn(nm_s), FadeIn(nm_c),
        )
        self.wait(0.5)

        lc = line.copy()
        self.add(lc)
        self.play(Indicate(r_line), lc.animate.shift(RIGHT * s), run_time=settings.MID)
        line2 = line_sh(2, settings.X_LINE)
        self.play(
            ReplacementTransform(VGroup(line, lc), line2),
            Transform(cont_l, cont_txt("2", settings.X_LINE)),
        )
        self.bring_to_front(r_line)

        sc = square.copy()
        self.add(sc)
        self.play(Indicate(r_sb), sc.animate.shift(RIGHT * s), run_time=settings.MID)
        sq21 = rect_sh(2, 1, settings.X_SQ)
        self.play(
            ReplacementTransform(VGroup(square, sc), sq21),
            Transform(cont_s, cont_txt("2", settings.X_SQ)),
        )
        sc2 = sq21.copy()
        self.add(sc2)
        self.play(Indicate(r_sl), sc2.animate.shift(UP * s), run_time=settings.MID)
        sq22 = rect_sh(2, 2, settings.X_SQ)
        self.play(
            ReplacementTransform(VGroup(sq21, sc2), sq22),
            Transform(cont_s, cont_txt("4", settings.X_SQ)),
        )
        self.bring_to_front(r_sb, r_sl)

        cc = cube.copy()
        self.bring_to_back(cc)
        self.play(Indicate(e_x), cc.animate.shift(tilt_vec(RIGHT * s)), run_time=settings.MID)
        b211 = box(2, 1, 1, settings.X_CUBE)
        self.play(
            ReplacementTransform(VGroup(cube, cc), b211),
            Transform(cont_c, cont_txt("2", settings.X_CUBE)),
        )
        cc2 = b211.copy()
        self.add(cc2)
        self.play(Indicate(e_y), cc2.animate.shift(tilt_vec(UP * s)), run_time=settings.MID)
        b221 = box(2, 2, 1, settings.X_CUBE)
        self.play(
            ReplacementTransform(VGroup(b211, cc2), b221),
            Transform(cont_c, cont_txt("4", settings.X_CUBE)),
        )
        cc3 = b221.copy()
        self.bring_to_back(cc3)
        self.play(Indicate(e_z), cc3.animate.shift(tilt_vec(IN * s)), run_time=settings.MID)
        b222 = box(2, 2, 2, settings.X_CUBE)
        self.play(
            ReplacementTransform(VGroup(b221, cc3), b222),
            Transform(cont_c, cont_txt("8", settings.X_CUBE)),
        )
        self.bring_to_front(e_x, e_y, e_z)
        self.wait(0.5)

        grow_spec = [(0, 1, BLUE_C), (2, 3, GOLD_C), (3, 4, GREEN_C)]
        f_l = form_txt("2 = 2¹", settings.X_LINE, grow_spec)
        self.play(FadeIn(f_l[0:3]), TransformFromCopy(d_l, f_l[3:4]))
        self.remove(f_l[0:3], f_l[3:4])
        self.add(f_l)
        f_s = form_txt("4 = 2²", settings.X_SQ, grow_spec)
        self.play(FadeIn(f_s[0:3]), TransformFromCopy(d_s, f_s[3:4]))
        self.remove(f_s[0:3], f_s[3:4])
        self.add(f_s)
        f_c = form_txt("8 = 2³", settings.X_CUBE, grow_spec)
        self.play(FadeIn(f_c[0:3]), TransformFromCopy(d_c, f_c[3:4]))
        self.remove(f_c[0:3], f_c[3:4])
        self.add(f_c)

        fm = formula_txt("content = sᵈ", [(0, 7, BLUE_C), (8, 9, GOLD_C), (9, 10, GREEN_C)])
        fnote = Text("content of the original shape = 1", color=settings.MUTED)
        fnote.scale(settings.FRAC_SCALE).move_to([0, settings.FNOTE_Y, 0])
        self.play(FadeIn(fm), FadeIn(fnote), FadeOut(caption))
        self.play(Indicate(fm[9], color=GREEN_C))
        self.wait(1)

        fm2 = formula_txt("content = (1/2)ᵈ", [(0, 7, BLUE_C), (8, 13, GOLD_C), (13, 14, GREEN_C)])
        self.play(Transform(fm, fm2))
        line0 = line_sh(1, settings.X_LINE)
        sq0 = rect_sh(1, 1, settings.X_SQ)
        cb0 = box(1, 1, 1, settings.X_CUBE)
        self.play(
            ReplacementTransform(line2, line0),
            ReplacementTransform(sq22, sq0),
            ReplacementTransform(b222, cb0),
            Transform(cont_l, cont_txt("1", settings.X_LINE)),
            Transform(cont_s, cont_txt("1", settings.X_SQ)),
            Transform(cont_c, cont_txt("1", settings.X_CUBE)),
            run_time=settings.MID,
        )

        g_l = line_sh(1, settings.X_LINE).set_stroke(settings.MUTED, width=settings.STROKE_GRID)
        g_s = rect_sh(1, 1, settings.X_SQ)
        g_s.set_fill(settings.MUTED, opacity=0)
        g_s.set_stroke(settings.MUTED, width=settings.STROKE_GRID)
        g_c = cube_frame(settings.X_CUBE, colour=settings.MUTED)
        self.play(FadeIn(g_l), FadeIn(g_s), FadeIn(g_c))

        sl = line_sh(0.5, settings.X_LINE)
        ssq = rect_sh(0.5, 0.5, settings.X_SQ)
        scb = box(0.5, 0.5, 0.5, settings.X_CUBE)
        self.play(
            ReplacementTransform(line0, sl),
            ReplacementTransform(sq0, ssq),
            ReplacementTransform(cb0, scb),
            Transform(cont_l, cont_txt("1/2", settings.X_LINE)),
            Transform(cont_s, cont_txt("1/4", settings.X_SQ)),
            Transform(cont_c, cont_txt("1/8", settings.X_CUBE)),
            run_time=settings.SLOW,
        )
        shrink_spec = [(0, 3, BLUE_C), (4, 9, GOLD_C), (9, 10, GREEN_C)]
        self.play(
            Transform(f_l, form_txt("1/2 = (1/2)¹", settings.X_LINE, shrink_spec)),
            Transform(f_s, form_txt("1/4 = (1/2)²", settings.X_SQ, shrink_spec)),
            Transform(f_c, form_txt("1/8 = (1/2)³", settings.X_CUBE, shrink_spec)),
        )
        self.wait(0.5)

        fl2 = line_sh(0.5, settings.X_LINE)
        fl2.shift(RIGHT * s / 2)
        q2 = rect_sh(0.5, 0.5, settings.X_SQ)
        q2.shift(RIGHT * s / 2)
        q3 = rect_sh(0.5, 0.5, settings.X_SQ)
        q3.shift(UP * s / 2)
        q4 = rect_sh(0.5, 0.5, settings.X_SQ)
        q4.shift(RIGHT * s / 2 + UP * s / 2)
        offs = [t for t in product((0, 1), repeat=3) if t != (0, 0, 0)]
        shifts = [tilt_vec(RIGHT * i * s / 2 + UP * j * s / 2 + IN * k * s / 2) for i, j, k in offs]
        shifts.sort(key=lambda v: v[2])
        cpieces = []
        for v in shifts:
            piece = box(0.5, 0.5, 0.5, settings.X_CUBE)
            piece.shift(v)
            cpieces.append(piece)
        anims = [TransformFromCopy(sl, fl2), TransformFromCopy(ssq, q2), TransformFromCopy(ssq, q3), TransformFromCopy(ssq, q4)]
        anims += [TransformFromCopy(scb, p) for p in cpieces]
        self.play(LaggedStart(*anims, lag_ratio=0.15), run_time=settings.SLOW)
        self.play(
            ReplacementTransform(VGroup(sl, fl2), line_grid(2, settings.X_LINE)),
            ReplacementTransform(VGroup(ssq, q2, q3, q4), sq_grid(2, settings.X_SQ)),
            ReplacementTransform(VGroup(scb, *cpieces), cube_grid(2, settings.X_CUBE)),
        )

        note = Text("same formula up or down - the exponent counts the rulers", color=settings.MUTED)
        note.scale(settings.CAPTION_SCALE).move_to([0, settings.NOTE2_Y, 0])
        self.play(FadeIn(note))
        self.wait(1)


def eq_at(value, x, y, spec, scale=settings.EQ_SCALE):
    t = Text(value, color=settings.INK).scale(scale).move_to([x, y, 0])
    return paint(t, spec)


def sqf_gr(depth, corner, side):
    p = np.array([corner[0], corner[1], 0])
    if depth == 0:
        sq = Polygon(p, p + RIGHT * side, p + RIGHT * side + UP * side, p + UP * side)
        sq.set_stroke(width=0)
        sq.set_fill(BLUE_C, opacity=0.55)
        return VGroup(sq)
    h2 = side / 2
    g = VGroup()
    g.add(*sqf_gr(depth - 1, corner, h2))
    g.add(*sqf_gr(depth - 1, (corner[0] + h2, corner[1]), h2))
    g.add(*sqf_gr(depth - 1, (corner[0], corner[1] + h2), h2))
    return g


class DimMeasure(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        s4 = settings.S4
        row = settings.ROW4_Y
        ex_spec = [(0, 1, BLUE_C), (2, 3, GOLD_C), (3, 4, GREEN_C)]

        caption = caption_txt("a shape between the dimensions")
        fml = Text("content = sᵈ", color=settings.INK).scale(settings.FML4_SCALE)
        fml.move_to([0, settings.FML4_Y, 0])
        paint(fml, [(0, 7, BLUE_C), (8, 9, GOLD_C), (9, 10, GREEN_C)])
        snote = Text("s = 2", color=GOLD_C).scale(settings.EQ_SCALE)
        snote.move_to([0, settings.SNOTE_Y, 0])
        self.play(FadeIn(fml), FadeIn(snote), FadeIn(caption))
        self.wait(0.5)

        ln = line_sh(1, settings.X4A, size=s4, y=row)
        sq = rect_sh(1, 1, settings.X4B, size=s4, y=row)
        cb = box(1, 1, 1, settings.X4C, size=s4, y=row)
        self.play(FadeIn(ln), FadeIn(sq), FadeIn(cb))

        ln2 = line_sh(2, settings.X4A, size=s4, y=row)
        ln2.move_to([settings.X4A, row, 0])
        c_l = Text("2", color=BLUE_C).scale(settings.EQ_SCALE).move_to([settings.X4A, settings.CONT4_Y, 0])
        d_l = Text("1", color=GREEN_C).scale(settings.EQ_SCALE).move_to([settings.X4A, settings.D4_Y, 0])
        i_l = eq_at("2 = 2¹", settings.X4A, settings.INST4_Y, ex_spec)
        self.play(ReplacementTransform(ln, ln2), FadeIn(c_l), FadeIn(d_l), run_time=settings.FAST)
        self.play(FadeIn(i_l), run_time=settings.FAST)

        sq2 = rect_sh(2, 2, settings.X4B, size=s4, y=row)
        sq2.move_to([settings.X4B, row, 0])
        c_q = Text("4", color=BLUE_C).scale(settings.EQ_SCALE).move_to([settings.X4B, settings.CONT4_Y, 0])
        d_q = Text("2", color=GREEN_C).scale(settings.EQ_SCALE).move_to([settings.X4B, settings.D4_Y, 0])
        i_q = eq_at("4 = 2²", settings.X4B, settings.INST4_Y, ex_spec)
        self.play(ReplacementTransform(sq, sq2), FadeIn(c_q), FadeIn(d_q), run_time=settings.FAST)
        self.play(FadeIn(i_q), run_time=settings.FAST)

        cb2 = box(2, 2, 2, settings.X4C, size=s4, y=row)
        cb2.move_to([settings.X4C, row, 0])
        c_c = Text("8", color=BLUE_C).scale(settings.EQ_SCALE).move_to([settings.X4C, settings.CONT4_Y, 0])
        d_c = Text("3", color=GREEN_C).scale(settings.EQ_SCALE).move_to([settings.X4C, settings.D4_Y, 0])
        i_c = eq_at("8 = 2³", settings.X4C, settings.INST4_Y, ex_spec)
        self.play(ReplacementTransform(cb, cb2), FadeIn(c_c), FadeIn(d_c), run_time=settings.FAST)
        self.play(FadeIn(i_c), run_time=settings.FAST)
        self.wait(0.5)

        a = settings.FR4_S
        st = sqf_gr(settings.FR4_DEPTH, (settings.X4D - a / 2, row - a / 2), a)
        self.play(FadeIn(st))
        self.wait(0.5)
        gb = (settings.X4D - a, row - a)
        p0 = np.array([gb[0], gb[1], 0])
        ghost = Polygon(p0, p0 + RIGHT * 2 * a, p0 + RIGHT * 2 * a + UP * 2 * a, p0 + UP * 2 * a)
        ghost.set_fill(settings.MUTED, opacity=0)
        ghost.set_stroke(settings.MUTED, width=settings.STROKE_GRID)
        self.play(Create(ghost))
        self.play(st.animate.shift([-a / 2, -a / 2, 0]), run_time=settings.MID)
        st2 = st.copy()
        st2.shift([a, 0, 0])
        st3 = st.copy()
        st3.shift([0, a, 0])
        c_s = Text("3", color=BLUE_C).scale(settings.EQ_SCALE).move_to([settings.X4D, settings.CONT4_Y, 0])
        self.play(TransformFromCopy(st, st2), TransformFromCopy(st, st3), run_time=settings.MID)
        self.play(FadeIn(c_s))
        d_s = Text("?", color=GREEN_C).scale(settings.EQ_SCALE).move_to([settings.X4D, settings.D4_Y, 0])
        i_s = eq_at("3 = 2ᵈ", settings.X4D, settings.INST4_Y, ex_spec)
        self.play(FadeIn(i_s), FadeIn(d_s))
        self.wait(0.5)

        t_spec = [(0, 1, GOLD_C), (1, 2, GREEN_C), (3, 4, BLUE_C)]
        t1 = eq_at("2¹ = 2", -settings.TRIAL_DX, settings.TRIAL_Y, t_spec)
        t2 = eq_at("2² = 4", settings.TRIAL_DX, settings.TRIAL_Y, t_spec)
        self.play(TransformFromCopy(i_l, t1))
        self.play(TransformFromCopy(i_q, t2))
        sand = eq_at("2 < 3 < 4", 0, settings.SAND_Y, [(0, 1, BLUE_C), (2, 3, BLUE_C), (4, 5, BLUE_C)])
        self.play(
            FadeIn(sand[1:2]), FadeIn(sand[3:4]),
            TransformFromCopy(t1[3], sand[0:1]),
            TransformFromCopy(c_s, sand[2:3]),
            TransformFromCopy(t2[3], sand[4:5]),
        )
        self.remove(sand[0:1], sand[1:2], sand[2:3], sand[3:4], sand[4:5])
        self.add(sand)
        bounds = eq_at("1 < d < 2", 0, settings.SAND_Y, [(0, 1, GREEN_C), (2, 3, GREEN_C), (4, 5, GREEN_C)])
        self.wait(0.5)
        self.play(ReplacementTransform(sand, bounds))
        self.play(Indicate(d_s, color=GREEN_C))
        self.wait(0.5)

        naming = Text("the logarithm reads the exponent", color=settings.MUTED)
        naming.scale(settings.NAME_SCALE).move_to([0, settings.NAME4_Y, 0])
        logln = eq_at(
            "d = log 3 / log 2 ≈ 1.585", 0, settings.TRIAL_Y,
            [(0, 1, GREEN_C), (5, 6, BLUE_C), (10, 11, GOLD_C), (12, 17, GREEN_C)],
        )
        self.play(FadeOut(t1), FadeOut(t2), FadeIn(naming), FadeIn(logln))
        d_val = Text("1.585", color=GREEN_C).scale(settings.EQ_SCALE).move_to(d_s.get_center())
        self.play(TransformFromCopy(logln[12:17], d_val), FadeOut(d_s))
        self.wait(0.5)
        gen = eq_at(
            "d = log content / log s", 0, settings.SAND_Y,
            [(0, 1, GREEN_C), (5, 12, BLUE_C), (16, 17, GOLD_C)],
        )
        self.play(FadeOut(bounds), FadeIn(gen))
        self.wait(1)

        nl = Line(
            [-settings.NL_LEN / 2, settings.NL_Y, 0], [settings.NL_LEN / 2, settings.NL_Y, 0],
            color=settings.INK, stroke_width=settings.STROKE_GRID,
        )
        unit = settings.NL_LEN / 3.5

        def tick_x(v):
            return -settings.NL_LEN / 2 + (v + 0.25) * unit

        ticks = VGroup()
        tick_lbls = VGroup()
        for i in range(4):
            tx = tick_x(i)
            tick = Line([tx, settings.NL_Y - 0.1, 0], [tx, settings.NL_Y + 0.1, 0], color=settings.INK)
            ticks.add(tick)
            lb = Text(str(i), color=settings.INK).scale(settings.FRAC_SCALE)
            lb.move_to([tx, settings.NL_Y - 0.4, 0])
            tick_lbls.add(lb)
        self.play(
            FadeOut(naming), FadeOut(logln), FadeOut(gen),
            Create(nl), FadeIn(ticks), FadeIn(tick_lbls),
        )
        pairs = ((d_l, 1), (d_q, 2), (d_c, 3), (d_val, np.log(3) / np.log(2)))
        for src, v in pairs:
            dot = Dot([tick_x(v), settings.NL_Y, 0], color=GREEN_C)
            self.play(TransformFromCopy(src, dot), run_time=settings.FAST)
        note = caption_txt("rough natural shapes live between the whole numbers")
        self.play(FadeOut(caption), FadeIn(note))
        self.wait(1)


def zigzag(a, b, depth, amp, sign):
    if depth == 0:
        return [a]
    ab = b - a
    perp = np.array([-ab[1], ab[0], 0])
    perp = perp / np.linalg.norm(perp)
    m = (a + b) / 2 + perp * amp * sign
    decay = settings.ZIG_DECAY
    return zigzag(a, m, depth - 1, amp * decay, sign) + zigzag(m, b, depth - 1, amp * decay, -sign)


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


def plot_pt(ox, step, total, ymax):
    px = ox + step / settings.PLOT4_XMAX * settings.PLOT4_W
    py = settings.PLOT4_OY + total / ymax * settings.PLOT4_H
    return [px, py, 0]


def bar_g(step, x):
    b = flat_ruler([x - step / 2, settings.RULBAR_Y, 0], [x + step / 2, settings.RULBAR_Y, 0])
    lb = Text(f"{step}", color=GOLD_C).scale(settings.NAME_SCALE).next_to(b, RIGHT, buff=0.15)
    return VGroup(b, lb)


def row_txt(step, total, x, row):
    t = Text(f"{step}: {total:.2f}", color=settings.INK).scale(settings.EQ_SCALE)
    t.move_to([x, settings.ROW1_Y - row * settings.ROW_DY, 0])
    return paint(t, [(0, 3, GOLD_C), (4, 8, BLUE_C)])


def delta_txt(diff, x, row, colour):
    t = Text(f"+{diff:.2f}", color=colour).scale(settings.NAME_SCALE)
    t.move_to([x + settings.DELTA_DX, settings.ROW1_Y - (row - 0.5) * settings.ROW_DY, 0])
    return t


def pieces_txt(n, x):
    t = Text(f"pieces: {n}", color=settings.INK).scale(settings.EQ_SCALE)
    t.move_to([x, settings.ROW1_Y, 0])
    return paint(t, [(0, 7, settings.MUTED), (7, 8, BLUE_C)])


class SettleOrGrow(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        xs = -settings.P4_DX
        xz = settings.P4_DX

        caption = caption_txt("lay the ruler along the curve, add it up")
        theta = np.linspace(np.pi, 0, 600)
        smooth_pts = [
            np.array([
                xs + settings.CURVE4_A * np.cos(t),
                settings.CURVE4_Y + settings.CURVE4_B * np.sin(t),
                0,
            ])
            for t in theta
        ]
        za = np.array([xz - settings.CURVE4_A, settings.CURVE4_Y, 0])
        zb = np.array([xz + settings.CURVE4_A, settings.CURVE4_Y, 0])
        zig_corners = zigzag(za, zb, settings.ZIG_DEPTH, settings.ZIG_AMP, 1) + [zb]
        zig_pts = dense_pts(zig_corners, 20)
        smooth_curve = VMobject(color=BLUE_C, stroke_width=settings.STROKE_GRID + 2)
        smooth_curve.set_points_as_corners(smooth_pts)
        zig_curve = VMobject(color=BLUE_C, stroke_width=settings.STROKE_GRID + 2)
        zig_curve.set_points_as_corners(zig_pts)

        self.play(Create(smooth_curve), FadeIn(caption))
        first_step = settings.RULER_STEPS[0]
        bar_s = bar_g(first_step, xs)
        counter = pieces_txt(0, xs)
        self.play(FadeIn(bar_s), FadeIn(counter))
        anchors0, total0 = chord_walk(smooth_pts, first_step)
        cha = []
        for i, (p, q) in enumerate(zip(anchors0, anchors0[1:])):
            ch = Line(p, q, color=GOLD_C, stroke_width=settings.STROKE_GRID + 1)
            cha.append(ch)
            self.play(
                TransformFromCopy(bar_s[0], ch),
                Transform(counter, pieces_txt(i + 1, xs)),
                run_time=0.5,
            )
        row_s0 = row_txt(first_step, total0, xs, 0)
        self.play(Transform(counter, row_s0))
        self.wait(0.5)

        anchz, totalz = chord_walk(zig_pts, first_step)
        chz = VGroup(*[
            Line(p, q, color=GOLD_C, stroke_width=settings.STROKE_GRID + 1)
            for p, q in zip(anchz, anchz[1:])
        ])
        bar_z = bar_g(first_step, xz)
        self.play(Create(zig_curve), FadeIn(bar_z))
        rowz0 = row_txt(first_step, totalz, xz, 0)
        self.play(Create(chz), run_time=settings.SLOW)
        self.play(FadeIn(rowz0))
        self.wait(0.5)

        old = {"s": VGroup(*cha), "z": chz}
        bars = {"s": bar_s, "z": bar_z}
        rowvals = {"s": [total0], "z": [totalz]}
        rows_m = {"s": [counter], "z": [rowz0]}
        pts_by = {"s": smooth_pts, "z": zig_pts}
        xs_by = {"s": xs, "z": xz}
        for row_i, step in enumerate(settings.RULER_STEPS[1:], start=1):
            anims = []
            for tag in ("s", "z"):
                anchors, total = chord_walk(pts_by[tag], step)
                chords = VGroup(*[
                    Line(p, q, color=GOLD_C, stroke_width=settings.STROKE_GRID + 1)
                    for p, q in zip(anchors, anchors[1:])
                ])
                nbar = bar_g(step, xs_by[tag])
                nrow = row_txt(step, total, xs_by[tag], row_i)
                diff = total - rowvals[tag][-1]
                dcol = GREEN_C if tag == "s" else CORAL_C
                dtxt = delta_txt(diff, xs_by[tag], row_i, dcol)
                anims += [
                    ReplacementTransform(old[tag], chords),
                    ReplacementTransform(bars[tag], nbar),
                    FadeIn(nrow), FadeIn(dtxt),
                ]
                old[tag] = chords
                bars[tag] = nbar
                rowvals[tag].append(total)
                rows_m[tag].append(nrow)
            self.play(*anims, run_time=settings.SLOW)
            self.wait(0.3)

        axes = VGroup()
        for x in (xs, xz):
            ox = x - settings.PLOT4_W / 2
            ax = Line([ox, settings.PLOT4_OY, 0], [ox + settings.PLOT4_W, settings.PLOT4_OY, 0],
                      color=settings.MUTED, stroke_width=settings.STROKE_GRID)
            ay = Line([ox, settings.PLOT4_OY, 0], [ox, settings.PLOT4_OY + settings.PLOT4_H, 0],
                      color=settings.MUTED, stroke_width=settings.STROKE_GRID)
            xl = Text("ruler size", color=settings.MUTED).scale(settings.AXLBL_SCALE)
            xl.next_to(ax, DOWN, buff=0.1)
            yl = Text("measured length", color=settings.MUTED).scale(settings.AXLBL_SCALE)
            yl.rotate(90 * DEGREES).next_to(ay, LEFT, buff=0.1)
            axes.add(ax, ay, xl, yl)
        self.play(FadeIn(axes), FadeOut(caption))

        dot_anims = []
        pdots = {"s": [], "z": []}
        for tag in ("s", "z"):
            ymax = rowvals[tag][-1] * settings.PLOT4_HEADROOM
            dcol = GREEN_C if tag == "s" else CORAL_C
            for i, step in enumerate(settings.RULER_STEPS):
                pdot = Dot(
                    plot_pt(xs_by[tag] - settings.PLOT4_W / 2, step, rowvals[tag][i], ymax),
                    color=dcol, radius=0.06,
                )
                pdots[tag].append(pdot)
                dot_anims.append(TransformFromCopy(rows_m[tag][i], pdot))
        self.play(LaggedStart(*dot_anims, lag_ratio=0.2), run_time=settings.SLOW)

        trend_s = VMobject(color=GREEN_C, stroke_width=settings.STROKE_GRID + 1)
        trend_s.set_points_as_corners([d.get_center() for d in pdots["s"]])
        trend_z = VMobject(color=CORAL_C, stroke_width=settings.STROKE_GRID + 1)
        trend_z.set_points_as_corners([d.get_center() for d in pdots["z"]])
        lbl_y = settings.PLOT4_OY + settings.PLOT4_H / 2
        settle = Text("settles", color=GREEN_C).scale(settings.EQ_SCALE)
        settle.move_to([xs + settings.PLOT4_W / 2 + settings.TREND_LBL_DX + 0.3, lbl_y, 0])
        grow = Text("keeps growing", color=CORAL_C).scale(settings.EQ_SCALE)
        grow.move_to([xz + settings.PLOT4_W / 2 + settings.TREND_LBL_DX + 0.4, lbl_y, 0])
        self.play(Create(trend_s), Create(trend_z))
        self.play(FadeIn(settle), FadeIn(grow))
        note = Text("the jagged curve has no settled length", color=settings.MUTED)
        note.scale(settings.CAPTION_SCALE).move_to([0, settings.NOTE2_Y, 0])
        self.play(FadeIn(note))
        self.wait(1)
