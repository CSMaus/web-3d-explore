from manim import UP, Create, FadeIn, FadeOut, LaggedStart, SurroundingRectangle, Transform, VGroup, there_and_back

import layout
import mathx
import parts
import settings
from short import Short, num
from v03_game import data
from v03_game import places as P

SCENE = "Game"
U = settings.STAGE_UNIT
TEN = [data.score(faces, data.PRIZE) for faces in data.PLAYERS]
TWELVE = [data.score(faces, data.FAIR) for faces in data.PLAYERS]
FEW = (
    min(min(s[:data.FEW + 1]) for s in TEN) - P.GRAPH_PAD,
    max(max(s[:data.FEW + 1]) for s in TEN) + P.GRAPH_PAD,
)
LONG = (min(min(s) for s in TEN + TWELVE) - P.GRAPH_PAD, max(max(s) for s in TEN + TWELVE) + P.GRAPH_PAD)
SOLO = (min(data.ONE) - P.GRAPH_PAD, max(data.ONE) + P.GRAPH_PAD)


def coin(x: float, y: float, colour: str, w: float = P.COIN_W, h: float = P.COIN_H):
    made = parts.box(x - w / 2, y - h / 2, x + w / 2, y + h / 2, colour)
    return made.set_stroke(settings.BACKGROUND, 1.5)


def pile(x: float, y0: float, count: int, colour: str, w=P.COIN_W, h=P.COIN_H, step=P.COIN_STEP) -> VGroup:
    return VGroup(*[coin(x, y0 + h / 2 + step * k, colour, w, h) for k in range(count)])


def spot(rounds: int, span, at: float, value: float):
    x = P.GRAPH_X0 + (P.GRAPH_X1 - P.GRAPH_X0) * at / rounds
    y = P.GRAPH_Y0 + (P.GRAPH_Y1 - P.GRAPH_Y0) * (value - span[0]) / (span[1] - span[0])
    return x, y


def trace(scores, rounds: int, span, colour: str, width: float = P.LINE_STROKE):
    return parts.path([spot(rounds, span, i, s) for i, s in enumerate(scores[:rounds + 1])], colour, width)


def level(rounds: int, span):
    return parts.line(spot(rounds, span, 0, 0), spot(rounds, span, rounds, 0), settings.MUTED, P.THIN_STROKE)


def ends(rounds: int, lang: str) -> VGroup:
    return VGroup(
        parts.text("0", P.LABEL_SIZE, settings.MUTED, (P.GRAPH_X0, P.LABEL_Y)),
        parts.text(num(rounds, lang), P.LABEL_SIZE, settings.MUTED, (P.GRAPH_X1 - 4, P.LABEL_Y)),
    )


def slope(per_round: float):
    return parts.line(
        spot(data.ROUNDS, LONG, 0, 0), spot(data.ROUNDS, LONG, data.ROUNDS, per_round * data.ROUNDS), settings.INK, 2.5, dashed=True
    )


def solo(lang: str) -> VGroup:
    return VGroup(level(data.ROUNDS, SOLO), ends(data.ROUNDS, lang), trace(data.ONE, data.ROUNDS, SOLO, settings.ACCENT_CONTRAST))


class Game(Short):
    video = "v03_game"

    def construct(self):
        v = data.values(self.lang)
        stake = pile(P.STAKE_X, P.PILES_Y, data.COST, settings.ACCENT_CONTRAST)
        prize = pile(P.PRIZE_X, P.PILES_Y, data.PRIZE, settings.ACCENT_STABLE)
        die = parts.die(P.DIE_AT, P.DIE_SIDE, mathx.FACES)
        with self.beat("b01") as b:
            self.top("ставка {cost}, приз {prize} | stake {cost}, prize {prize}", **v)
            self.play(LaggedStart(FadeIn(stake), FadeIn(die), FadeIn(prize), lag_ratio=0.4), run_time=b.share(0.6))
        with self.beat("b02") as b:
            self.play(prize.animate(rate_func=there_and_back).shift(UP * P.JUMP * U), run_time=b.share(0.5))

        first = solo(self.lang)
        with self.beat("b03") as b:
            self.top("после 1000 раундов: {total1000} | after 1000 rounds: {total1000}", **v)
            self.play(FadeOut(stake), FadeOut(prize), FadeOut(die), FadeIn(first[0]), FadeIn(first[1]), run_time=b.share(0.15))
            self.play(Create(first[2]), run_time=b.share(0.6))
        with self.beat("b04") as b:
            self.play(first.animate.set_stroke(opacity=P.GRAPH_DIM), first[1].animate.set_opacity(P.GRAPH_DIM), run_time=b.share(0.5))

        dice = VGroup(*[parts.die((x, P.DICE_Y), P.DICE_SIDE, face + 1) for face, x in enumerate(P.DICE_X)])
        with self.beat("b05") as b:
            self.top("6 раундов | 6 rounds")
            self.play(FadeOut(first), LaggedStart(*[FadeIn(d) for d in dice], lag_ratio=0.2), run_time=b.share(0.5))

        small = (P.SMALL_W, P.SMALL_H, P.SMALL_STEP)
        stakes = [
            pile(x, P.ROUND_Y - P.SMALL_STEP * data.COST, data.COST, settings.ACCENT_CONTRAST, *small) for x in P.DICE_X
        ]
        with self.beat("b06") as b:
            self.top("заплачено: {paid} | paid: {paid}", **v)
            self.play(LaggedStart(*[FadeIn(s) for s in stakes], lag_ratio=0.5), run_time=b.share(0.6))
        won = pile(P.DICE_X[-1], P.ROUND_Y, data.PRIZE, settings.ACCENT_STABLE, *small)
        with self.beat("b07") as b:
            self.top("получено: {prize} | won: {prize}", **v)
            self.play(LaggedStart(*[FadeIn(c, shift=UP * U) for c in won], lag_ratio=0.3), run_time=b.share(0.6))

        paid = [c for s in stakes for c in s]
        extra = VGroup(*paid[data.PRIZE:])
        with self.beat("b08") as b:
            self.top("{prize} − {paid} = {net} | {prize} − {paid} = {net}", **v)
            self.play(
                *[c.animate.move_to(layout.S(P.LEFT_X, P.COLUMNS_Y + P.SMALL_H / 2 + P.SMALL_STEP * k)) for k, c in enumerate(paid)],
                *[c.animate.move_to(layout.S(P.RIGHT_X, P.COLUMNS_Y + P.SMALL_H / 2 + P.SMALL_STEP * k)) for k, c in enumerate(won)],
                run_time=b.share(0.4),
            )
            self.play(extra.animate(rate_func=there_and_back).set_fill(opacity=P.BLINK), run_time=b.share(0.25))

        third = P.SMALL_W / 3
        slices = VGroup(*[
            coin(P.LEFT_X + third * (i % 3 - 1), P.COLUMNS_Y + P.SMALL_H / 2 + P.SMALL_STEP * (data.PRIZE + i // 3), settings.ACCENT_CONTRAST, third, P.SMALL_H)
            for i in range(mathx.FACES)
        ])
        with self.beat("b09") as b:
            self.top("{net} / 6 = {mean} | {net} / 6 = {mean}", **v)
            self.add(slices)
            self.remove(*extra)
            self.play(
                *[piece.animate.move_to(layout.S(x, P.SLICE_Y)) for piece, x in zip(slices, P.DICE_X)],
                run_time=b.share(0.55),
            )
        frame = SurroundingRectangle(self.line, color=settings.ACCENT_MATH, buff=P.FRAME_GAP, stroke_width=3)
        with self.beat("b10") as b:
            self.play(Create(frame), run_time=b.share(0.5))

        colours = [settings.ACCENT_STABLE if s[data.FEW] > 0 else settings.ACCENT_STRUCTURE for s in TEN]
        lines = VGroup(*[trace(s, data.FEW, FEW, colour) for s, colour in zip(TEN, colours)])
        zero = level(data.FEW, FEW)
        marks = ends(data.FEW, self.lang)
        with self.beat("b11") as b:
            self.play(
                FadeOut(frame), FadeOut(dice), FadeOut(slices), FadeOut(won), *[FadeOut(c) for c in paid[:data.PRIZE]],
                run_time=b.share(0.12),
            )
            self.top("20 раундов | 20 rounds")
            self.play(FadeIn(zero), FadeIn(marks), run_time=b.share(0.1))
            self.play(*[Create(line) for line in lines], run_time=b.share(0.5))

        def long_lines(scores) -> list:
            return [
                Transform(line, trace(s, data.ROUNDS, LONG, settings.ACCENT_STRUCTURE, P.THIN_STROKE)) for line, s in zip(lines, scores)
            ]

        with self.beat("b12") as b:
            self.top("1000 раундов | 1000 rounds")
            self.play(
                *long_lines(TEN),
                Transform(zero, level(data.ROUNDS, LONG)),
                Transform(marks, ends(data.ROUNDS, self.lang)),
                run_time=b.share(0.65),
            )
        tilt = slope(mathx.expected_gain(data.PRIZE, data.COST))
        with self.beat("b13") as b:
            self.top("{mean} за раунд | {mean} a round", **v)
            self.play(Create(tilt), run_time=b.share(0.5))
        with self.beat("b14") as b:
            self.top("приз {fair} | prize {fair}", **v)
            self.play(*long_lines(TWELVE), run_time=b.share(0.75))
        with self.beat("b15") as b:
            self.top("{mean_fair} за раунд | {mean_fair} a round", **v)
            self.play(Transform(tilt, slope(mathx.expected_gain(data.FAIR, data.COST))), run_time=b.share(0.5))
        with self.beat("b16") as b:
            self.top("приз {prize} | prize {prize}", **v)
            self.play(
                *long_lines(TEN),
                Transform(tilt, slope(mathx.expected_gain(data.PRIZE, data.COST))),
                run_time=b.share(0.6),
            )
        last = solo(self.lang)
        with self.beat("b17") as b:
            self.top("после 1000 раундов: {total1000} | after 1000 rounds: {total1000}", **v)
            self.play(FadeOut(lines), FadeOut(tilt), FadeOut(zero), FadeOut(marks), run_time=b.share(0.25))
            self.play(FadeIn(last), run_time=b.share(0.4))
        self.finish()
