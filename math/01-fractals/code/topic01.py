from itertools import product

import numpy as np
from manim import (
    Scene, ThreeDScene, Dot3D, Line, Square, Cube, Prism, Rectangle, Arrow, Arrow3D,
    Text, VGroup,
    GrowArrow, GrowFromPoint, GrowFromEdge, Create, Transform, FadeIn, FadeOut,
    ReplacementTransform, TransformFromCopy, LaggedStart, Indicate,
    interpolate_color, ManimColor, rotate_vector,
    DEGREES, ORIGIN, RIGHT, UP, OUT, IN, DOWN,
)

import settings

LIGHT = np.array(settings.LIGHT_DIR, dtype=float)
LIGHT = LIGHT / np.linalg.norm(LIGHT)
DARK = ManimColor(settings.CUBE_DARK)
BRIGHT = ManimColor(settings.CUBE_LIGHT)


def dim_label(value):
    return Text(value, color=settings.ACCENT_MATH).scale(1.3).to_corner(UP + RIGHT)


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


def small_cube(n, idx, fill):
    step = settings.SHAPE_SIZE / n
    i, j, k = idx
    c = Cube(side_length=step * fill)
    c.move_to((RIGHT * i + UP * j + OUT * k - (RIGHT + UP + OUT) * (n - 1) / 2) * step)
    return c


def tilt(m):
    m.rotate(settings.TILT_Y * DEGREES, axis=UP, about_point=ORIGIN)
    m.rotate(settings.TILT_X * DEGREES, axis=RIGHT, about_point=ORIGIN)
    return m


def tilt_vec(v):
    w = rotate_vector(v, settings.TILT_Y * DEGREES, UP)
    return rotate_vector(w, settings.TILT_X * DEGREES, RIGHT)


def grid_idx(n):
    return [t for t in product(range(n), repeat=3) if not (0 < t[0] < n - 1 and 0 < t[1] < n - 1 and 0 < t[2] < n - 1)]


def cube_grid(n, x, fill=settings.TILE_FILL):
    cubes = VGroup(*[small_cube(n, t, fill) for t in grid_idx(n)])
    tilt(cubes)
    faces = [f for c in cubes for f in shade_faces(c)]
    faces.sort(key=lambda m: m.get_center()[2])
    return VGroup(*faces).shift([x, settings.ROW_Y, 0])


def cube_frame(n, x, idx, colour=settings.ACCENT_MATH):
    c = small_cube(n, idx, 1 if n == 1 else settings.TILE_FILL)
    tilt(c)
    centre = c.get_center()
    faces = [f for f in c if face_out(f, centre)[2] > 0]
    for f in faces:
        f.set_fill(colour, opacity=0)
        f.set_stroke(colour, width=settings.STROKE_FRAME)
    return VGroup(*faces).shift([x, settings.ROW_Y, 0])


def box(w, h, d, x):
    s = settings.SHAPE_SIZE
    p = Prism(dimensions=[w * s, h * s, d * s])
    p.shift(np.array([(w - 1) * s / 2, (h - 1) * s / 2, (1 - d) * s / 2]))
    tilt(p)
    faces = shade_faces(p)
    faces.sort(key=lambda m: m.get_center()[2])
    return VGroup(*faces).shift([x, settings.ROW_Y, 0])


def line_sh(w, x):
    s = settings.SHAPE_SIZE
    l = Line(ORIGIN, RIGHT * w * s, color=settings.ACCENT_STRUCTURE, stroke_width=settings.STROKE_MAIN)
    l.move_to([x + (w - 1) * s / 2, settings.ROW_Y, 0])
    return l


def rect_sh(w, h, x):
    s = settings.SHAPE_SIZE
    r = Rectangle(width=w * s, height=h * s)
    r.set_stroke(settings.ACCENT_STRUCTURE, width=settings.STROKE_GRID)
    r.set_fill(settings.ACCENT_STRUCTURE, opacity=0.25)
    r.move_to([x + (w - 1) * s / 2, settings.ROW_Y + (h - 1) * s / 2, 0])
    return r


def line_grid(n, x, fill=settings.TILE_FILL):
    step = settings.SHAPE_SIZE / n
    g = VGroup()
    for i in range(n):
        piece = Line(ORIGIN, RIGHT * step * fill, color=settings.ACCENT_STRUCTURE, stroke_width=settings.STROKE_MAIN)
        piece.move_to([x + (i - (n - 1) / 2) * step, settings.ROW_Y, 0])
        g.add(piece)
    return g


def sq_grid(n, x, fill=settings.TILE_FILL):
    step = settings.SHAPE_SIZE / n
    g = VGroup()
    for i, j in product(range(n), repeat=2):
        sq = Square(side_length=step * fill)
        sq.set_stroke(settings.ACCENT_STRUCTURE, width=settings.STROKE_GRID)
        sq.set_fill(settings.ACCENT_STRUCTURE, opacity=0.25)
        sq.move_to([x + (i - (n - 1) / 2) * step, settings.ROW_Y + (j - (n - 1) / 2) * step, 0])
        g.add(sq)
    return g


def flat_ruler(p1, p2):
    return Line(p1, p2, color=settings.ACCENT_MATH, stroke_width=settings.STROKE_MAIN + 2)


def edge_ruler(x, axis):
    s = settings.SHAPE_SIZE
    p0 = np.array([-s / 2, -s / 2, s / 2])
    e = Line(p0, p0 + axis * s, color=settings.ACCENT_MATH, stroke_width=settings.STROKE_MAIN + 2)
    tilt(e)
    return e.shift(np.array([x, settings.ROW_Y, 0]))


def paint(t, spec):
    for a, b, colour in spec:
        t[a:b].set_color(colour)
    return t


def dim_txt(value, x):
    t = Text(value, color=settings.ACCENT_STABLE).scale(settings.COUNT_SCALE)
    return t.move_to([x, settings.COUNT_Y, 0])


def cont_txt(value, x):
    t = Text(value, color=settings.ACCENT_STRUCTURE).scale(settings.COUNT_SCALE)
    return t.move_to([x, settings.CONT_Y, 0])


def form_txt(value, x, spec):
    t = Text(value, color=settings.INK).scale(settings.EQ_SCALE).move_to([x, settings.EQ_Y, 0])
    return paint(t, spec)


def formula_txt(value, spec):
    t = Text(value, color=settings.INK).scale(settings.FORMULA_SCALE).move_to([0, settings.FORM_Y, 0])
    return paint(t, spec)


class DimAsDirections(ThreeDScene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND

        count = dim_label("0")
        caption = Text("independent directions", color=settings.MUTED).scale(0.6).to_edge(DOWN)
        self.add_fixed_in_frame_mobjects(count, caption)
        self.play(FadeIn(caption))

        dot = Dot3D(ORIGIN, color=settings.ACCENT_STRUCTURE)
        self.play(GrowFromPoint(dot, ORIGIN))
        self.wait(0.5)

        arrow_x = Arrow(ORIGIN, RIGHT * 3, color=settings.ACCENT_MATH, buff=0)
        line = Line(ORIGIN, RIGHT * 3, color=settings.ACCENT_STRUCTURE)
        self.play(GrowArrow(arrow_x))
        self.play(GrowFromPoint(line, ORIGIN), run_time=2)
        self.play(Transform(count, dim_label("1")))
        self.wait(0.5)

        arrow_y = Arrow(ORIGIN, UP * 3, color=settings.ACCENT_MATH, buff=0)
        square = Square(side_length=3).move_to(RIGHT * 1.5 + UP * 1.5)
        square.set_stroke(settings.ACCENT_STRUCTURE).set_fill(settings.ACCENT_STRUCTURE, opacity=0.25)
        self.play(GrowArrow(arrow_y))
        self.play(GrowFromEdge(square, DOWN))
        self.play(Transform(count, dim_label("2")))
        self.wait(0.5)

        self.move_camera(phi=70 * DEGREES, theta=-45 * DEGREES, run_time=1.5)
        arrow_z = Arrow3D(ORIGIN, OUT * 3, color=settings.ACCENT_MATH)
        cube = Cube(side_length=3).move_to(RIGHT * 1.5 + UP * 1.5 + OUT * 1.5)
        cube.set_stroke(settings.INK, width=1).set_fill(settings.ACCENT_STRUCTURE, opacity=0.15)
        self.play(Create(arrow_z))
        self.play(Create(cube))
        self.play(Transform(count, dim_label("3")))
        self.wait(1)


class DimAsScaling(ThreeDScene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        s = settings.SHAPE_SIZE
        gold = settings.ACCENT_MATH
        green = settings.ACCENT_STABLE
        blue = settings.ACCENT_STRUCTURE

        caption = Text("scale the size, watch the content", color=settings.MUTED)
        caption.scale(settings.CAPTION_SCALE).to_edge(DOWN)
        line = line_sh(1, settings.X_LINE)
        square = rect_sh(1, 1, settings.X_SQ)
        cube = box(1, 1, 1, settings.X_CUBE)
        self.play(FadeIn(line), FadeIn(square), FadeIn(cube), FadeIn(caption))

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
        self.play(FadeIn(cont_l), FadeIn(cont_s), FadeIn(cont_c))
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
        self.bring_to_back(cc2)
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

        grow_spec = [(0, 1, blue), (2, 3, gold), (3, 4, green)]
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

        fm = formula_txt("content = sᵈ", [(0, 7, blue), (8, 9, gold), (9, 10, green)])
        fnote = Text("content of the original shape = 1", color=settings.MUTED)
        fnote.scale(settings.FRAC_SCALE).move_to([0, settings.FNOTE_Y, 0])
        self.play(FadeIn(fm), FadeIn(fnote), FadeOut(caption))
        self.play(Indicate(fm[9], color=green))
        self.wait(1)

        fm2 = formula_txt("content = (1/2)ᵈ", [(0, 7, blue), (8, 13, gold), (13, 14, green)])
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
        g_c = cube_frame(1, settings.X_CUBE, (0, 0, 0), colour=settings.MUTED)
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
        shrink_spec = [(0, 3, blue), (4, 9, gold), (9, 10, green)]
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


def ex_txt(value, x, spec):
    t = Text(value, color=settings.INK).scale(settings.EX_SCALE).move_to([x, settings.EX_Y, 0])
    return paint(t, spec)


def mid_txt(value, y, spec):
    t = Text(value, color=settings.INK).scale(settings.REL_SCALE).move_to([0, y, 0])
    return paint(t, spec)


def chk_txt(value, x, spec):
    t = Text(value, color=settings.INK).scale(settings.CHECK_SCALE).move_to([x, settings.CHECK_Y, 0])
    return paint(t, spec)


def slot_arrow(src, dst):
    return Arrow(
        src.get_bottom(), dst.get_top(),
        color=settings.MUTED, stroke_width=settings.ARROW_STROKE, buff=0.1,
    )


class DimFromCounts(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        blue = settings.ACCENT_STRUCTURE
        gold = settings.ACCENT_MATH
        green = settings.ACCENT_STABLE

        caption = Text("reading d back out of the formula", color=settings.MUTED)
        caption.scale(settings.CAPTION_SCALE).to_edge(DOWN)
        ex_spec = [(0, 1, blue), (2, 3, gold), (3, 4, green)]
        e_l = ex_txt("2 = 2¹", settings.X_LINE, ex_spec)
        e_s = ex_txt("4 = 2²", settings.X_SQ, ex_spec)
        e_c = ex_txt("8 = 2³", settings.X_CUBE, ex_spec)
        note = Text("s = 2", color=gold).scale(settings.EX_SCALE)
        note.move_to([0, settings.NOTE_Y, 0])
        self.play(FadeIn(e_l), FadeIn(e_s), FadeIn(e_c), FadeIn(note), FadeIn(caption))
        self.wait(0.5)

        num = mid_txt("4 = 2²", settings.NUM_Y, [(0, 1, blue), (2, 3, gold), (3, 4, green)])
        self.play(Indicate(e_s))
        self.play(TransformFromCopy(e_s, num), run_time=settings.MID)
        self.wait(0.5)

        gen = mid_txt(
            "content = sᵈ", settings.GEN_Y,
            [(0, 7, blue), (8, 9, gold), (9, 10, green)],
        )
        parts = [gen[7:8], gen[0:7], gen[8:9], gen[9:10]]
        a_content = slot_arrow(num[0:1], gen[0:7])
        a_scale = slot_arrow(num[2:3], gen[8:9])
        a_dim = slot_arrow(num[3:4], gen[9:10])
        self.play(FadeIn(parts[0]))
        self.play(GrowArrow(a_content), TransformFromCopy(num[0:1], parts[1]))
        self.play(GrowArrow(a_scale), TransformFromCopy(num[2:3], parts[2]))
        self.play(GrowArrow(a_dim), TransformFromCopy(num[3:4], parts[3]))
        self.wait(1)
        self.remove(*parts)
        self.add(gen)
        self.play(FadeOut(a_content), FadeOut(a_scale), FadeOut(a_dim))

        num_log = mid_txt(
            "log 4 = 2 · log 2", settings.NUM_Y,
            [(3, 4, blue), (5, 6, green), (10, 11, gold)],
        )
        self.play(ReplacementTransform(num, num_log), run_time=settings.MID)
        gen_log = mid_txt(
            "log content = d · log s", settings.GEN_Y,
            [(3, 10, blue), (11, 12, green), (16, 17, gold)],
        )
        self.play(ReplacementTransform(gen, gen_log), run_time=settings.MID)
        self.wait(0.5)

        num_d = mid_txt(
            "2 = log 4 / log 2", settings.NUM_Y,
            [(0, 1, green), (5, 6, blue), (10, 11, gold)],
        )
        self.play(ReplacementTransform(num_log, num_d), run_time=settings.MID)
        gen_d = mid_txt(
            "d = log content / log s", settings.GEN_Y,
            [(0, 1, green), (5, 12, blue), (16, 17, gold)],
        )
        self.play(ReplacementTransform(gen_log, gen_d), run_time=settings.MID)
        self.wait(0.5)

        chk_spec = [(0, 1, green), (5, 6, blue), (10, 11, gold)]
        ch_l = chk_txt("1 = log 2 / log 2", settings.X_LINE, chk_spec)
        ch_s = chk_txt("2 = log 4 / log 2", settings.X_SQ, chk_spec)
        ch_c = chk_txt("3 = log 8 / log 2", settings.X_CUBE, chk_spec)
        self.play(TransformFromCopy(num_d, ch_s), run_time=settings.MID)
        self.play(
            LaggedStart(
                TransformFromCopy(num_d, ch_l),
                TransformFromCopy(num_d, ch_c),
                lag_ratio=0.4,
            ),
            run_time=settings.SLOW,
        )
        self.play(
            Indicate(ch_l[0], color=green),
            Indicate(ch_s[0], color=green),
            Indicate(ch_c[0], color=green),
        )
        self.wait(1)
