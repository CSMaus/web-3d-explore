import math

from manim import DOWN, Create, FadeIn, FadeOut, GrowFromEdge, LaggedStart, VGroup, linear, there_and_back

import layout
import mathx
import parts
import settings
from short import Short, num
from v05_taxi import data
from v05_taxi import places as P

SCENE = "Taxi"


def at(minutes: float) -> float:
    return P.X0 + (P.X1 - P.X0) * minutes / data.SPAN


def up(density: float) -> float:
    return P.BASE + (P.TOP - P.BASE) * density / P.MOST


def drift(minutes: float):
    return layout.S(at(minutes), 0) - layout.S(at(0), 0)


def scale(y: float, lang: str) -> VGroup:
    marks = range(0, data.SPAN + 1, P.TICK_EVERY)
    ticks = VGroup(*[parts.line((at(t), y), (at(t), y - P.TICK_DROP), settings.MUTED, P.TICK_STROKE) for t in marks])
    names = VGroup(*[parts.text(num(t, lang), P.LABEL_SIZE, settings.MUTED, (at(t), y - P.LABEL_DROP)) for t in marks])
    return VGroup(parts.line((at(0), y), (at(data.SPAN), y), settings.MUTED, P.AXIS_STROKE), ticks, names)


def gone() -> VGroup:
    x, y = at(data.WAITED), P.AXIS_Y + P.NOW_GAP
    return VGroup(
        parts.line((at(0), P.AXIS_Y), (x, P.AXIS_Y), settings.MUTED, P.GONE_STROKE),
        parts.area([(x - P.NOW_HALF, y + P.NOW_TALL), (x + P.NOW_HALF, y + P.NOW_TALL), (x, y)], settings.INK, 1),
        parts.dot((at(0), P.AXIS_Y + P.PERSON_UP), P.PERSON, settings.INK),
    )


def span(start: float, y: float, colour: str, dashed: bool = False):
    return parts.line((at(start), y), (at(start + data.WAITED), y), colour, P.SPAN_STROKE, dashed)


def strokes() -> VGroup:
    low, high = P.AXIS_Y + P.MARK_GAP, P.AXIS_Y + P.MARK_GAP + P.MARK_TALL
    return VGroup(*[
        parts.line((at(t), low), (at(t), high), settings.INK, P.MARK_STROKE).set_stroke(opacity=P.MARK_SEEN)
        for t in data.WAITS[:P.MARKS] if t < data.SPAN
    ])


def columns(bins: int, fill: float = 1.0) -> VGroup:
    return parts.bars(data.bars(data.WAITS, bins), P.X0, P.X1, P.BASE, P.TOP, settings.ACCENT_STRUCTURE, most=P.MOST, fill=fill)


def trace(start: float, end: float) -> list:
    grid = [start + (end - start) * i / (P.CURVE_POINTS - 1) for i in range(P.CURVE_POINTS)]
    return [(at(t), up(mathx.density("exponential", t))) for t in grid]


def curve(start: float, end: float):
    return parts.path(trace(start, end), settings.ACCENT_STABLE, P.CURVE_STROKE)


def tail():
    edge = [(at(data.SPAN), P.BASE), (at(data.LONG), P.BASE)]
    return parts.area(trace(data.LONG, data.SPAN) + edge, settings.ACCENT_STABLE, P.SHADE)


def cut(minutes: float, top: float):
    return parts.line((at(minutes), P.BASE), (at(minutes), top), settings.INK, P.CUT_STROKE)


def level() -> float:
    return up(mathx.density("uniform", 0))


def half(start: float, colour: str):
    return parts.box(at(start), P.BASE, at(start + data.WAITED), level(), colour, P.BUS_FILL, P.BUS_STROKE)


def small(colour: str, width: float):
    grid = [P.TAXI_SPAN * i / (P.CURVE_POINTS - 1) for i in range(P.CURVE_POINTS)]
    return parts.path([
        (
            P.TAXI_X0 + (P.TAXI_X1 - P.TAXI_X0) * t / P.TAXI_SPAN,
            P.TAXI_Y + P.TAXI_TALL * mathx.density("exponential", t) / P.MOST,
        )
        for t in grid
    ], colour, width)


def taxi() -> VGroup:
    return VGroup(
        parts.line((P.TAXI_X0, P.TAXI_Y), (P.TAXI_X1, P.TAXI_Y), settings.MUTED, P.AXIS_STROKE),
        small(settings.ACCENT_MATH, P.COPY_STROKE),
        small(settings.ACCENT_STABLE, P.CURVE_STROKE),
    )


class Taxi(Short):
    video = "v05_taxi"

    def construct(self):
        v = data.values(self.lang)
        axis = scale(P.AXIS_Y, self.lang)
        past = gone()
        with self.beat("b01") as b:
            self.top("прошло 10 минут | 10 minutes gone")
            self.play(FadeIn(axis), FadeIn(past), run_time=b.share(0.6))
        ahead = span(data.WAITED, P.AHEAD_Y, settings.ACCENT_MATH)
        first = span(0, P.START_Y, settings.INK, dashed=True)
        with self.beat("b02") as b:
            self.top("в среднем ещё {mean} минут | {mean} more minutes on average", **v)
            self.play(Create(ahead), Create(first), run_time=b.share(0.5))
        with self.beat("b03") as b:
            self.top("-")
            self.play(FadeOut(ahead), FadeOut(first), FadeOut(past), run_time=b.share(0.5))

        marks = strokes()
        with self.beat("b04") as b:
            self.top("{waits} ожиданий | {waits} waits", **v)
            self.play(LaggedStart(*[FadeIn(mark) for mark in marks], lag_ratio=0.05), run_time=b.share(0.7))
        heap = columns(P.BINS[0])
        with self.beat("b05") as b:
            self.top("корзина 5 минут | bins of 5 minutes")
            self.play(axis.animate.shift(layout.S(0, P.BASE) - layout.S(0, P.AXIS_Y)), FadeOut(marks), run_time=b.share(0.3))
            self.play(LaggedStart(*[GrowFromEdge(bar, DOWN) for bar in heap], lag_ratio=0.2), run_time=b.share(0.4))
        with self.beat("b06") as b:
            self.top("корзина {w} минуты | bins of {w} minutes", **v)
            for k, bins in enumerate(P.BINS[1:], 1):
                finer = columns(bins)
                self.hold(b.at(k / len(P.BINS)))
                self.play(FadeOut(heap), FadeIn(finer), run_time=b.share(P.SWAP))
                heap = finer

        left = curve(0, data.WAITED)
        right = curve(data.WAITED, data.SPAN)
        with self.beat("b07") as b:
            self.play(Create(left), heap.animate.set_fill(opacity=P.DIM_BARS), run_time=b.share(0.15), rate_func=linear)
            self.play(Create(right), run_time=b.share(0.5), rate_func=linear)
        shade = tail()
        with self.beat("b08") as b:
            self.play(FadeIn(shade), run_time=b.share(0.5))
        wall = cut(data.LONG, P.TOP)
        with self.beat("b09") as b:
            self.top("дольше 20 минут: {beyond20} | over 20 minutes: {beyond20}", **v)
            self.play(Create(wall), run_time=b.share(0.25))
            self.play(shade.animate.set_fill(opacity=P.BLINK), run_time=b.share(0.4), rate_func=there_and_back)
        with self.beat("b10") as b:
            self.top("ещё ждут: {still} из {waits} | still waiting: {still} of {waits}", **v)
            self.play(
                wall.animate.shift(drift(data.WAITED) - drift(data.LONG)),
                FadeOut(shade), FadeOut(heap),
                left.animate.set_stroke(opacity=P.DIM_CURVE),
                run_time=b.share(0.6),
            )
        rest = right.copy().set_stroke(settings.ACCENT_MATH, P.COPY_STROKE)
        with self.beat("b11") as b:
            self.add(rest)
            self.bring_to_back(rest)
            self.play(rest.animate.shift(-drift(data.WAITED)), run_time=b.share(0.6))
        with self.beat("b12") as b:
            self.play(
                rest.animate.stretch(math.e, 1, about_point=layout.S(P.X0, P.BASE)),
                left.animate.set_stroke(opacity=1),
                run_time=b.share(0.6),
            )
        before = span(0, P.START_Y, settings.INK)
        after = span(data.WAITED, P.AHEAD_Y, settings.ACCENT_MATH)
        with self.beat("b13") as b:
            self.top("в среднем ещё {mean} минут | {mean} more minutes on average", **v)
            self.play(Create(before), Create(after), run_time=b.share(0.5))

        halves = VGroup(half(0, settings.ACCENT_STRUCTURE), half(data.WAITED, settings.ACCENT_STRUCTURE))
        with self.beat("b14") as b:
            self.top("автобус каждые 20 минут | a bus every 20 minutes")
            self.play(
                FadeOut(left), FadeOut(right), FadeOut(rest), FadeOut(before), FadeOut(after), FadeOut(wall),
                run_time=b.share(0.25),
            )
            self.play(FadeIn(halves), run_time=b.share(0.4))
        gate = cut(data.WAITED, level() + P.CUT_OVER)
        short = half(data.WAITED, settings.ACCENT_MATH)
        with self.beat("b15") as b:
            self.top("осталось не больше 10 минут | at most 10 minutes left")
            self.play(Create(gate), run_time=b.share(0.2))
            self.add(short)
            self.play(
                halves[0].animate.set_fill(opacity=P.DIM_HALF).set_stroke(opacity=P.DIM_HALF),
                short.animate.shift(-drift(data.WAITED)),
                run_time=b.share(0.45),
            )
        floor = parts.line((at(0), P.BASE), (at(P.BUS_SPAN), P.BASE), settings.MUTED, P.AXIS_STROKE)
        bus = VGroup(floor, halves, short, gate)
        cab = taxi()
        with self.beat("b16") as b:
            self.play(FadeOut(axis), FadeIn(floor), run_time=b.share(0.15))
            self.play(
                bus.animate.scale(P.BUS_SMALL).move_to(layout.S(*P.BUS_AT), aligned_edge=DOWN),
                FadeIn(cab),
                run_time=b.share(0.5),
            )
        again = VGroup(
            scale(P.AXIS_Y, self.lang),
            gone(),
            span(data.WAITED, P.AHEAD_Y, settings.ACCENT_MATH),
            span(0, P.START_Y, settings.INK, dashed=True),
        )
        with self.beat("b17") as b:
            self.top("прошло 10 минут | 10 minutes gone")
            self.play(FadeOut(bus), FadeOut(cab), run_time=b.share(0.25))
            self.play(FadeIn(again), run_time=b.share(0.4))
        self.finish()
