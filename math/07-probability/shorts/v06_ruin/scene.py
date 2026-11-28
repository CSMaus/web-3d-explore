from manim import DOWN, TAU, UP, Arrow, Create, FadeIn, FadeOut, GrowArrow, GrowFromEdge, MoveAlongPath, Sector, Transform, VGroup, linear, there_and_back

import layout
import mathx
import parts
import settings
from short import Short, num
from v06_ruin import data
from v06_ruin import places as P

SCENE = "Ruin"


def at(toss: float, span: int) -> float:
    return P.X0 + (P.X1 - P.X0) * toss / span


def up(coins: float) -> float:
    return P.LOW + P.COIN_TALL * coins


def reach() -> float:
    return mathx.reach_chance(data.START, data.GOAL, data.P)


def wall(y: float, colour: str):
    return parts.line((P.X0, y), (P.X1, y), colour, P.WALL_STROKE)


def names(lang: str) -> VGroup:
    return VGroup(
        parts.text(num(data.GOAL, lang), P.NAME_SIZE, settings.ACCENT_STABLE, (P.NAME_X, P.HIGH)),
        parts.text(num(0, lang), P.NAME_SIZE, settings.ACCENT_CONTRAST, (P.NAME_X, P.LOW)),
    )


def player():
    return parts.dot((P.X0, P.DOT_Y), P.DOT, settings.INK).set_z_index(P.FRONT)


def slice_of(start: float, share: float, colour: str) -> Sector:
    return Sector(
        radius=P.COIN * settings.STAGE_UNIT,
        start_angle=TAU * start,
        angle=TAU * share,
        color=colour,
        arc_center=layout.S(*P.COIN_AT),
    )


def coin_of() -> VGroup:
    return VGroup(
        slice_of(P.COIN_TURN, data.P, settings.ACCENT_STABLE),
        slice_of(P.COIN_TURN + data.P, 1 - data.P, settings.ACCENT_CONTRAST),
    )


def split(share: float) -> VGroup:
    cut = P.HIGH - (P.HIGH - P.LOW) * share
    return VGroup(
        parts.box(P.BAR_X0, cut, P.BAR_X1, P.HIGH, settings.ACCENT_STABLE),
        parts.box(P.BAR_X0, P.LOW, P.BAR_X1, cut, settings.ACCENT_CONTRAST),
    )


def trail(game, first: int, last: int, span: int, colour: str, width: float):
    return parts.path([(at(t, span), up(game[t])) for t in range(first, last + 1)], colour, width)


def tint(game) -> str:
    return settings.ACCENT_STABLE if game[-1] >= data.GOAL else settings.ACCENT_CONTRAST


def crowd(games) -> VGroup:
    return VGroup(*[
        trail(game, 0, min(len(game) - 1, P.GAME_SPAN), P.GAME_SPAN, tint(game), P.THIN).set_stroke(opacity=P.SEEN)
        for game in games
    ])


def arrow(start: float, end: float, width: float) -> Arrow:
    return Arrow(
        layout.S(P.X0, start),
        layout.S(P.X0, end),
        buff=0,
        stroke_width=width,
        color=settings.INK,
        tip_length=P.TIP * settings.STAGE_UNIT,
    )


def arrows(high: float, low: float) -> VGroup:
    return VGroup(arrow(P.DOT_Y + P.ARROW_GAP, P.HIGH, high), arrow(P.DOT_Y - P.ARROW_GAP, P.LOW, low))


def sides(lang: str) -> VGroup:
    words = num(data.GOAL - data.START, lang)
    return VGroup(
        parts.text(words, P.SIDE_SIZE, settings.INK, (P.SIDE_X, (P.DOT_Y + P.HIGH) / 2)),
        parts.text(words, P.SIDE_SIZE, settings.INK, (P.SIDE_X, (P.DOT_Y + P.LOW) / 2)),
    )


def stops() -> list[int]:
    bets = len(data.ONE_UNFAIR) - 1
    return [bets * k // P.COUNT_PARTS for k in range(P.COUNT_PARTS + 1)]


def counter(bets: int, lang: str):
    return parts.text(num(bets, lang), P.COUNT_SIZE, settings.INK, P.COUNT_AT)


def mean_line():
    pull = data.P - (1 - data.P)
    return parts.line(
        (at(0, P.GAME_SPAN), up(data.START)),
        (at(P.GAME_SPAN, P.GAME_SPAN), up(data.START + pull * P.GAME_SPAN)),
        settings.INK, P.MEAN_STROKE, dashed=True,
    )


def pair(lang: str) -> VGroup:
    v = data.values(lang)
    made = VGroup()
    looks = ((data.P, settings.ACCENT_MATH, v["pc"]), (reach(), settings.ACCENT_STRUCTURE, v["reach_pc"]))
    for (x0, x1), (share, colour, words) in zip(P.PAIR, looks):
        top = P.LOW + P.PAIR_TALL * share
        made.add(parts.box(x0, P.LOW, x1, top, colour))
        made.add(parts.text(words, P.PAIR_SIZE, colour, ((x0 + x1) / 2, top + P.PAIR_GAP)))
    return made


class Ruin(Short):
    video = "v06_ruin"

    def construct(self):
        v = data.values(self.lang)
        upper = wall(P.HIGH, settings.ACCENT_STABLE)
        lower = wall(P.LOW, settings.ACCENT_CONTRAST)
        marks = names(self.lang)
        dot = player()
        with self.beat("b01") as b:
            self.top("старт {start}, цель {goal} | start {start}, goal {goal}", **v)
            self.play(Create(upper), Create(lower), FadeIn(marks), run_time=b.share(0.35))
            self.play(FadeIn(dot), run_time=b.share(0.25))
        coin = coin_of()
        with self.beat("b02") as b:
            self.top("выигрыш в {pc} бросках из 100 | wins {pc} tosses of 100", **v)
            self.play(FadeIn(coin), run_time=b.share(0.5))
        bar = split(reach())
        with self.beat("b03") as b:
            self.top("до цели: {reach_pc} игр из 100 | reaches the goal: {reach_pc} games of 100", **v)
            self.play(GrowFromEdge(bar[0], UP), GrowFromEdge(bar[1], DOWN), run_time=b.share(0.5))
        with self.beat("b04") as b:
            self.play(
                bar.animate.set_fill(opacity=P.DIM),
                coin.animate.set_fill(opacity=P.DIM),
                run_time=b.share(0.5),
            )

        last = len(data.ONE_UNFAIR) - 1
        first = trail(data.ONE_UNFAIR, 0, P.FIRST_STEPS, P.STEP_SPAN, settings.ACCENT_STRUCTURE, P.TRAIL_STROKE)
        rest = trail(data.ONE_UNFAIR, P.FIRST_STEPS, last, P.STEP_SPAN, settings.ACCENT_STRUCTURE, P.TRAIL_STROKE)
        with self.beat("b05") as b:
            self.top("-")
            self.play(Create(first), MoveAlongPath(dot, first), run_time=b.share(0.6), rate_func=linear)
        with self.beat("b06") as b:
            self.play(Create(rest), MoveAlongPath(dot, rest), run_time=b.share(0.45), rate_func=linear)
            self.play(upper.animate.set_stroke(width=P.FLASH), run_time=b.share(0.2), rate_func=there_and_back)
        both = arrows(P.ARROW_STROKE, P.ARROW_STROKE)
        far = sides(self.lang)
        with self.beat("b07") as b:
            self.top("монета 50 на 50 | a 50 to 50 coin")
            self.play(
                FadeOut(first), FadeOut(rest),
                dot.animate.move_to(layout.S(P.X0, P.DOT_Y)),
                run_time=b.share(0.25),
            )
            self.play(GrowArrow(both[0]), GrowArrow(both[1]), FadeIn(far), run_time=b.share(0.35))
        with self.beat("b08") as b:
            self.top("до цели: 1 из 2 | reaches the goal: 1 of 2")
            self.play(Transform(bar, split(data.EVEN)), run_time=b.share(0.5))
        fair = crowd(data.FAIR)
        with self.beat("b09") as b:
            self.top("до цели: {fair_wins} из 100 | reached the goal: {fair_wins} of 100", **v)
            self.play(FadeOut(both), FadeOut(far), run_time=b.share(0.12))
            self.play(Create(fair, lag_ratio=0), run_time=b.share(0.5), rate_func=linear)

        with self.beat("b10") as b:
            self.top("выигрыш в {pc} бросках из 100 | wins {pc} tosses of 100", **v)
            self.play(
                FadeOut(fair), FadeOut(bar),
                coin.animate.set_fill(opacity=1),
                run_time=b.share(0.5),
            )
        marks_at = stops()
        single = VGroup(*[
            trail(data.ONE_UNFAIR, a, z, P.GAME_SPAN, settings.ACCENT_STRUCTURE, P.TRAIL_STROKE)
            for a, z in zip(marks_at, marks_at[1:])
        ])
        tally = counter(marks_at[0], self.lang)
        with self.beat("b11") as b:
            self.top("в среднем {bets} бросков | {bets} tosses on average", **v)
            self.add(tally)
            for piece, stop in zip(single, marks_at[1:]):
                self.play(Create(piece), run_time=b.share(P.PIECE), rate_func=linear)
                self.remove(tally)
                tally = counter(stop, self.lang)
                self.add(tally)
        slope = mean_line()
        with self.beat("b12") as b:
            self.play(Create(slope), run_time=b.share(0.55))
        unfair = crowd(data.UNFAIR)
        with self.beat("b13") as b:
            self.top("до цели: {unfair_wins} из 100 | reached the goal: {unfair_wins} of 100", **v)
            self.play(FadeOut(single), FadeOut(tally), FadeOut(slope), run_time=b.share(0.12))
            self.play(Create(unfair, lag_ratio=0), run_time=b.share(0.5), rate_func=linear)

        with self.beat("b14") as b:
            self.top("ставка 10 монет | a stake of 10 coins")
            self.play(FadeOut(unfair), FadeOut(coin), run_time=b.share(0.5))
        bet = arrows(P.ARROW_WIDE * data.P, P.ARROW_WIDE * (1 - data.P))
        with self.beat("b15") as b:
            self.top("до цели: {pc} из 100 | reaches the goal: {pc} of 100", **v)
            self.play(GrowArrow(bet[0]), GrowArrow(bet[1]), run_time=b.share(0.5))
        two = pair(self.lang)
        with self.beat("b16") as b:
            self.top("{pc} против {reach_pc} | {pc} against {reach_pc}", **v)
            self.play(FadeOut(bet), FadeOut(dot), run_time=b.share(0.15))
            self.play(
                GrowFromEdge(two[0], DOWN), GrowFromEdge(two[2], DOWN), FadeIn(two[1]), FadeIn(two[3]),
                run_time=b.share(0.45),
            )
        again = player()
        tilt = crowd(data.UNFAIR)
        with self.beat("b17") as b:
            self.top("старт {start}, цель {goal} | start {start}, goal {goal}", **v)
            self.play(FadeOut(two), run_time=b.share(0.15))
            self.play(FadeIn(again), Create(tilt, lag_ratio=0), run_time=b.share(0.5), rate_func=linear)
        self.finish()
