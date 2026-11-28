import math

from manim import Create, FadeIn, FadeOut, LaggedStart, Succession, Transform, VGroup

import layout
import parts
import settings
from short import Short, dec, num
from v04_silence import data
from v04_silence import places as P

SCENE = "Silence"


def tape(moments, rows) -> VGroup:
    cells, ticks, calm = VGroup(), VGroup(), VGroup()
    silent = data.quiet(moments, data.ROW * len(rows))
    for minute in range(data.ROW * len(rows)):
        y0, y1 = rows[minute // data.ROW]
        x0 = P.TAPE_X0 + P.CELL_W * (minute % data.ROW)
        cells.add(parts.box(x0, y0, x0 + P.CELL_W, y1, settings.MUTED, 0, P.CELL_STROKE))
        if minute in silent:
            calm.add(parts.box(x0, y0, x0 + P.CELL_W, y1, settings.ACCENT_STABLE, P.QUIET))
    for t in moments:
        y0, y1 = rows[math.floor(t) // data.ROW]
        x = P.TAPE_X0 + P.CELL_W * (t % data.ROW)
        ticks.add(parts.line((x, y0 + P.TICK_GAP), (x, y1 - P.TICK_GAP), settings.INK, P.TICK_STROKE))
    return VGroup(cells, ticks, calm)


def cut_at(i: int, n: int) -> float:
    return P.WIDE_X0 + (P.WIDE_X1 - P.WIDE_X0) * i / n


def cuts(n: int, colour: str, stroke: float) -> VGroup:
    return VGroup(*[
        parts.line((cut_at(i, n), P.WIDE_Y0), (cut_at(i, n), P.WIDE_Y1), colour, stroke) for i in range(1, n)
    ])


def piece(i: int, n: int, colour: str, fill: float, stroke: float = 0):
    return parts.box(cut_at(i, n), P.WIDE_Y0, cut_at(i + 1, n), P.WIDE_Y1, colour, fill, stroke)


def spot(n: float, chance: float, mean: int):
    span = math.log10(P.HIGH_CUT) - math.log10(P.LOW_CUT)
    x = P.GRAPH_X0 + (P.GRAPH_X1 - P.GRAPH_X0) * (math.log10(n) - math.log10(P.LOW_CUT)) / span
    return x, P.GRAPH_Y0 + (P.GRAPH_Y1 - P.GRAPH_Y0) * chance / P.TOPS[mean]


def curve(mean: int):
    grid = [P.LOW_CUT * (P.HIGH_CUT / P.LOW_CUT) ** (i / (P.CURVE_POINTS - 1)) for i in range(P.CURVE_POINTS)]
    return parts.path([spot(n, data.silence(n, mean), mean) for n in grid], settings.ACCENT_STRUCTURE, 3)


def limit(mean: int):
    level = math.exp(-mean)
    return parts.line(spot(P.LOW_CUT, level, mean), spot(P.HIGH_CUT, level, mean), settings.INK, 2, dashed=True)


def height(mean: int, lang: str):
    return parts.text(dec(P.TOPS[mean], P.TOP_PLACES, lang), P.LABEL_SIZE, settings.MUTED, (P.GRAPH_X0 - 7, P.GRAPH_Y1))


def named(words: str, mean: int):
    x, y = spot(P.HIGH_CUT, math.exp(-mean), mean)
    return parts.text(words, P.NAME_SIZE, settings.INK, (x - 8, y + P.NAME_GAP))


def axes(lang: str) -> VGroup:
    frame = VGroup(
        parts.line((P.GRAPH_X0, P.GRAPH_Y0), (P.GRAPH_X1, P.GRAPH_Y0), settings.MUTED, 1.5),
        parts.line((P.GRAPH_X0, P.GRAPH_Y0), (P.GRAPH_X0, P.GRAPH_Y1), settings.MUTED, 1.5),
    )
    names = VGroup(*[
        parts.text(num(n, lang), P.LABEL_SIZE, settings.MUTED, (spot(n, 0, data.MEAN)[0], P.LABEL_Y)) for n in data.CUTS
    ])
    return VGroup(frame, names, parts.text("0", P.LABEL_SIZE, settings.MUTED, (P.GRAPH_X0 - 4, P.GRAPH_Y0)))


def point(n: int):
    return parts.dot(spot(n, data.silence(n, data.MEAN), data.MEAN), P.DOT, settings.ACCENT_MATH)


class Silence(Short):
    video = "v04_silence"

    def construct(self):
        v = data.values(self.lang)
        strip = tape(data.CALLS, P.ROWS_Y)
        with self.beat("b01") as b:
            self.top("{mean} звонка в минуту | {mean} calls a minute", **v)
            self.play(FadeIn(strip[0]), run_time=b.share(0.1))
            self.play(LaggedStart(*[Create(tick) for tick in strip[1]], lag_ratio=0.3), run_time=b.share(0.65))
        with self.beat("b02") as b:
            self.play(FadeIn(strip[2]), run_time=b.share(0.5))

        wide = parts.box(P.WIDE_X0, P.WIDE_Y0, P.WIDE_X1, P.WIDE_Y1, settings.INK, 0, 2.5)
        minute = strip[0][P.TAKEN].copy().set_stroke(settings.INK)
        with self.beat("b03") as b:
            self.top("-")
            self.add(minute)
            self.play(
                strip.animate.scale(P.SMALL).move_to(layout.S(*P.SMALL_AT)),
                Transform(minute, wide),
                run_time=b.share(0.6),
            )
        six = cuts(6, settings.INK, P.CUT_STROKE)
        with self.beat("b04") as b:
            self.top("6 кусков | 6 slices")
            self.play(LaggedStart(*[Create(cut) for cut in six], lag_ratio=0.3), run_time=b.share(0.5))

        flashes = [
            parts.line(((cut_at(i, 6) + cut_at(i + 1, 6)) / 2, P.WIDE_Y0 + 2), ((cut_at(i, 6) + cut_at(i + 1, 6)) / 2, P.WIDE_Y1 - 2), settings.INK, 3)
            for i in range(6)
        ]
        taken = VGroup(*[piece(i, 6, settings.INK, P.FILLED) for i, call in enumerate(data.SLICES[6]) if call])
        with self.beat("b05") as b:
            self.play(
                LaggedStart(*[Succession(FadeIn(flash), FadeOut(flash)) for flash in flashes], lag_ratio=0.6),
                run_time=b.share(0.5),
            )
            self.add(taken)
            self.wait(b.share(0.15))
        rims = VGroup(*[piece(i, 6, settings.ACCENT_STABLE, 0, 3) for i in range(6)])
        with self.beat("b06") as b:
            self.top("шанс тишины: {p6} | chance of silence: {p6}", **v)
            self.remove(taken)
            self.play(LaggedStart(*[Create(rim) for rim in rims], lag_ratio=0.5), run_time=b.share(0.55))

        sixty = cuts(60, settings.MUTED, P.FINE_STROKE)
        frame = axes(self.lang)
        tall = height(data.MEAN, self.lang)
        dots = VGroup(*[point(n) for n in data.CUTS])
        with self.beat("b07") as b:
            self.top("60 кусков: {p60} | 60 slices: {p60}", **v)
            self.play(FadeOut(rims), FadeOut(six), FadeIn(sixty), run_time=b.share(0.25))
            self.play(FadeIn(frame), FadeIn(tall), FadeIn(dots[0]), FadeIn(dots[1]), run_time=b.share(0.3))
        hatch = parts.box(P.WIDE_X0, P.WIDE_Y0, P.WIDE_X1, P.WIDE_Y1, settings.MUTED, P.HATCH)
        with self.beat("b08") as b:
            self.top("600 кусков: {p600} | 600 slices: {p600}", **v)
            self.play(FadeOut(sixty), FadeIn(hatch), FadeIn(dots[2]), run_time=b.share(0.45))
        line = curve(data.MEAN)
        with self.beat("b09") as b:
            self.top("6000 кусков: {p6000} | 6000 slices: {p6000}", **v)
            self.play(FadeIn(dots[3]), Create(line), run_time=b.share(0.45))
        floor = limit(data.MEAN)
        with self.beat("b10") as b:
            self.play(Create(floor), run_time=b.share(0.5))
        with self.beat("b11") as b:
            self.top("{limit} ≈ 1/20 | {limit} ≈ 1/20", **v)
            self.play(FadeOut(minute), FadeOut(hatch), run_time=b.share(0.15))
            self.play(strip.animate.scale(1 / P.SMALL).move_to(layout.S(*P.TAPE_AT)), run_time=b.share(0.45))
        with self.beat("b12") as b:
            self.top("-")
            self.play(FadeOut(strip), run_time=b.share(0.5))
        with self.beat("b13") as b:
            self.top("1 звонок в минуту | 1 call a minute")
            self.play(
                FadeOut(dots),
                Transform(line, curve(1)),
                Transform(floor, limit(1)),
                Transform(tall, height(1, self.lang)),
                run_time=b.share(0.65),
            )
        one = named("1/e", 1)
        big = parts.text(v["e"], P.BIG_SIZE, settings.ACCENT_MATH, P.BIG_AT)
        with self.beat("b14") as b:
            self.top("{inv_e} = 1 / {e} | {inv_e} = 1 / {e}", **v)
            self.play(FadeIn(one), FadeIn(big), run_time=b.share(0.5))
        three = named("e⁻³", data.MEAN)
        with self.beat("b15") as b:
            self.top("e⁻³ = {limit} | e⁻³ = {limit}", **v)
            self.play(
                FadeOut(big), FadeOut(one), FadeIn(three),
                Transform(line, curve(data.MEAN)),
                Transform(floor, limit(data.MEAN)),
                Transform(tall, height(data.MEAN, self.lang)),
                run_time=b.share(0.6),
            )
        others = VGroup(*[tape(moments, (rows,)) for (_, moments), rows in zip(data.LINES, P.THREE_Y)])
        with self.beat("b16") as b:
            self.play(FadeOut(frame), FadeOut(tall), FadeOut(line), FadeOut(floor), FadeOut(three), run_time=b.share(0.2))
            self.play(LaggedStart(*[FadeIn(other) for other in others], lag_ratio=0.4), run_time=b.share(0.5))
        again = tape(data.CALLS, P.ROWS_Y)
        with self.beat("b17") as b:
            self.top("{mean} звонка в минуту | {mean} calls a minute", **v)
            self.play(FadeOut(others), run_time=b.share(0.25))
            self.play(FadeIn(again), run_time=b.share(0.4))
        self.finish()
