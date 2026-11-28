import numpy as np
from manim import DOWN, RIGHT, Circle, FadeIn, FadeOut, GrowFromEdge, LaggedStart, ReplacementTransform, ValueTracker, VGroup, always_redraw

import layout
import parts
import raster
import settings
from short import Short, num
from v02_test import data
from v02_test import places as P

SCENE = "Test"
U = settings.STAGE_UNIT
PIXEL = (P.FIELD_X1 - P.FIELD_X0) / P.COLS
FIELD_AT = ((P.FIELD_X0 + P.FIELD_X1) / 2, (P.FIELD_Y0 + P.FIELD_Y1) / 2)
PLAIN = [settings.MUTED] * 4
TOLD = [settings.MUTED, settings.ACCENT_MATH, settings.ACCENT_CONTRAST, settings.ACCENT_CONTRAST]


def tester() -> VGroup:
    x, y = P.STRIP_AT
    body = parts.box(x - P.STRIP_W / 2, y - P.STRIP_H / 2, x + P.STRIP_W / 2, y + P.STRIP_H / 2, settings.INK, 0, 3)
    plus = VGroup(
        parts.line((x - P.PLUS_ARM, y), (x + P.PLUS_ARM, y), settings.ACCENT_STABLE, P.PLUS_STROKE),
        parts.line((x, y - P.PLUS_ARM), (x, y + P.PLUS_ARM), settings.ACCENT_STABLE, P.PLUS_STROKE),
    )
    return VGroup(body, plus)


def people(kinds, palette):
    image = raster.field(raster.paint(kinds, palette, P.COLS), (P.FIELD_X1 - P.FIELD_X0) * U)
    return image.move_to(layout.S(*FIELD_AT))


def shown(count: int) -> np.ndarray:
    kinds = np.array(data.KINDS)
    kinds[data.SPREAD[count:]] = 0
    return kinds


def person_at(k: int):
    return layout.S(P.FIELD_X0 + (k % P.COLS + 0.5) * PIXEL, P.FIELD_Y1 - (k // P.COLS + 0.5) * PIXEL)


def halos() -> VGroup:
    return VGroup(*[
        Circle(radius=P.HALO).set_stroke(settings.ACCENT_CONTRAST, P.HALO_STROKE).move_to(person_at(k)) for k in data.ILL
    ])


def heap(count: int, colour: str, x0: float, x1: float):
    cols = round((x1 - x0) / PIXEL)
    image = raster.field(raster.paint([0] * count, [colour], cols), (x1 - x0) * U)
    return image.move_to(layout.S((x0 + x1) / 2, P.BASE_Y + image.height / U / 2))


def band(share: float) -> VGroup:
    cut = P.BAND_X0 + (P.BAND_X1 - P.BAND_X0) * share
    return VGroup(
        parts.box(P.BAND_X0, P.BAND_Y0, cut, P.BAND_Y1, settings.ACCENT_STABLE),
        parts.box(cut, P.BAND_Y0, P.BAND_X1, P.BAND_Y1, settings.ACCENT_MATH),
    )


def one_in(t: float) -> float:
    return P.SLIDE_FROM ** (1 - t) * P.SLIDE_TO ** t


def fraction(v: dict) -> VGroup:
    x, y = P.FRACTION_AT
    over = parts.text(v["ill_pos"], P.FRACTION_SIZE, settings.ACCENT_STABLE, (x, y + P.FRACTION_GAP))
    under = VGroup(
        parts.text(v["ill_pos"], P.FRACTION_SIZE, settings.ACCENT_STABLE, (0, 0)),
        parts.text("+", P.FRACTION_SIZE, settings.INK, (0, 0)),
        parts.text(v["healthy_pos"], P.FRACTION_SIZE, settings.ACCENT_MATH, (0, 0)),
    ).arrange(RIGHT, buff=2 * U).move_to(layout.S(x, y - P.FRACTION_GAP))
    bar = parts.line((x - P.FRACTION_HALF, y), (x + P.FRACTION_HALF, y), settings.INK, 2)
    return VGroup(over, bar, under)


class Test(Short):
    video = "v02_test"

    def construct(self):
        v = data.values(self.lang)
        strip = tester()
        with self.beat("b01") as b:
            self.top("тест находит {sens} из 100 больных | the test finds {sens} of 100 ill", **v)
            self.play(FadeIn(strip), run_time=b.share(0.5))
        ring = Circle(radius=P.RING_RADIUS * U).set_stroke(settings.ACCENT_CONTRAST, 4).move_to(layout.S(*P.STRIP_AT))
        with self.beat("b02") as b:
            self.play(FadeIn(ring), run_time=b.share(0.2))
            self.play(ring.animate.scale(P.RING_GROW).set_stroke(opacity=0), run_time=b.share(0.4))
            self.remove(ring)
        with self.beat("b03") as b:
            self.top("-")
            self.play(strip.animate.scale(P.STRIP_SMALL_W / P.STRIP_W).move_to(layout.S(*P.STRIP_SMALL_AT)), run_time=b.share(0.6))

        crowd = people(data.KINDS, PLAIN)
        cover = parts.box(P.FIELD_X0 - 1, P.FIELD_Y0 - 1, P.FIELD_X1 + 1, P.FIELD_Y1 + 1, settings.BACKGROUND)
        with self.beat("b04") as b:
            self.top("{people} человек | {people} people", **v)
            self.add(crowd, cover)
            self.play(cover.animate.stretch(parts.THIN, 1, about_edge=DOWN), run_time=b.share(0.7))
            self.remove(cover)

        marks = halos()
        found = VGroup(*[mark for mark, k in zip(marks, data.ILL) if data.KINDS[k] == 3])
        stages = [people(shown(round(len(data.SPREAD) * (i + 1) / P.STAGES)), TOLD) for i in range(P.STAGES)]
        ill = people(shown(0), TOLD)
        with self.beat("b05") as b:
            self.top("больных: {ill} | ill: {ill}", **v)
            self.add(ill)
            self.remove(crowd)
            self.play(LaggedStart(*[FadeIn(mark) for mark in marks], lag_ratio=0.05), run_time=b.share(0.6))
        with self.beat("b06") as b:
            self.top("найдено больных: {ill_pos} | ill found: {ill_pos}", **v)
            self.play(found.animate.set_stroke(settings.ACCENT_STABLE), run_time=b.share(0.5))
        with self.beat("b07"):
            self.top("ошибка: {false_pc} из 100 здоровых | wrong on {false_pc} of 100 healthy", **v)
        with self.beat("b08") as b:
            before = ill
            for stage in stages:
                self.add(stage)
                self.remove(before)
                self.add(marks)
                before = stage
                self.wait(b.share(0.8 / P.STAGES))
        full = stages[-1]
        with self.beat("b09") as b:
            self.add(full, marks)
            for count in range(1, P.COUNTS + 1):
                reached = num(round(data.C.healthy_positive * count / P.COUNTS), self.lang)
                self.top_now("ошибок: {n} | mistakes: {n}", n=reached)
                self.wait(b.share(0.6 / P.COUNTS))

        left = heap(data.C.ill_positive, settings.ACCENT_STABLE, P.LEFT_X0, P.LEFT_X1)
        right = heap(data.C.healthy_positive, settings.ACCENT_MATH, P.RIGHT_X0, P.RIGHT_X1)
        homes = (left.get_center(), right.get_center())
        left.move_to(layout.S(*FIELD_AT))
        right.move_to(layout.S(*FIELD_AT))
        with self.beat("b10") as b:
            self.play(full.animate.set_opacity(P.FIELD_DIM), FadeOut(marks), run_time=b.share(0.2))
            self.add(left, right)
            self.play(left.animate.move_to(homes[0]), right.animate.move_to(homes[1]), run_time=b.share(0.5))

        tall = P.BAR_MOST * data.C.ill_positive / data.C.healthy_positive
        ill_bar = parts.box(P.LEFT_X0, P.BASE_Y, P.LEFT_X1, P.BASE_Y + tall, settings.ACCENT_STABLE)
        well_bar = parts.box(P.RIGHT_X0, P.BASE_Y, P.RIGHT_X1, P.BASE_Y + P.BAR_MOST, settings.ACCENT_MATH)
        counts = VGroup(
            parts.text(v["ill_pos"], P.NUMBER_SIZE, settings.INK, ((P.LEFT_X0 + P.LEFT_X1) / 2, P.BASE_Y + tall + P.NUMBER_GAP)),
            parts.text(v["healthy_pos"], P.NUMBER_SIZE, settings.INK, ((P.RIGHT_X0 + P.RIGHT_X1) / 2, P.BASE_Y + P.BAR_MOST + P.NUMBER_GAP)),
        )
        with self.beat("b11") as b:
            self.top("{ill_pos} и {healthy_pos} | {ill_pos} and {healthy_pos}", **v)
            self.play(
                FadeOut(left), FadeOut(right), FadeOut(full),
                GrowFromEdge(ill_bar, DOWN), GrowFromEdge(well_bar, DOWN), FadeIn(counts),
                run_time=b.share(0.5),
            )
        whole = band(data.C.share)
        with self.beat("b12") as b:
            self.top("{share} % | {share} %", **v)
            self.play(
                FadeOut(counts),
                ReplacementTransform(ill_bar, whole[0]),
                ReplacementTransform(well_bar, whole[1]),
                run_time=b.share(0.6),
            )

        turn = ValueTracker(0)
        live = always_redraw(lambda: band(data.share_at(data.PER / one_in(turn.get_value()))))
        rail = parts.line((P.SLIDE_X0, P.SLIDE_Y), (P.SLIDE_X1, P.SLIDE_Y), settings.MUTED, 3)
        ends = VGroup(
            parts.text(num(P.SLIDE_FROM, self.lang), P.NUMBER_SIZE, settings.MUTED, (P.SLIDE_X0 + 4, P.SLIDE_LABEL_Y)),
            parts.text(num(P.SLIDE_TO, self.lang), P.NUMBER_SIZE, settings.MUTED, (P.SLIDE_X1 - 2, P.SLIDE_LABEL_Y)),
        )
        knob = always_redraw(lambda: parts.dot(
            (P.SLIDE_X0 + (P.SLIDE_X1 - P.SLIDE_X0) * turn.get_value(), P.SLIDE_Y), P.KNOB, settings.INK
        ))
        with self.beat("b13") as b:
            self.top("болен 1 из 10 | 1 in 10 is ill")
            self.remove(*whole)
            self.add(live)
            self.play(FadeIn(rail), FadeIn(ends), FadeIn(knob), run_time=b.share(0.15))
            self.play(turn.animate.set_value(1), run_time=b.share(0.55))
        with self.beat("b14"):
            self.top("{share10} % | {share10} %", **v)
        with self.beat("b15") as b:
            self.play(turn.animate.set_value(0), run_time=b.share(0.8))
        ratio = fraction(v)
        with self.beat("b16") as b:
            self.top("{ill_pos} / ({ill_pos} + {healthy_pos}) | {ill_pos} / ({ill_pos} + {healthy_pos})", **v)
            self.play(FadeIn(ratio), run_time=b.share(0.5))
        again = people(shown(len(data.SPREAD)), TOLD)
        with self.beat("b17") as b:
            self.top("{people} человек | {people} people", **v)
            still = VGroup(band(data.C.share), parts.dot((P.SLIDE_X0, P.SLIDE_Y), P.KNOB, settings.INK))
            self.remove(live, knob)
            self.add(still)
            self.play(FadeOut(ratio), FadeOut(still), FadeOut(rail), FadeOut(ends), run_time=b.share(0.25))
            self.play(FadeIn(again), FadeIn(marks), run_time=b.share(0.4))
        self.finish()
