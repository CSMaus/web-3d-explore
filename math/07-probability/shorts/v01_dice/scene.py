from manim import DOWN, Create, FadeIn, FadeOut, GrowFromEdge, LaggedStart, ReplacementTransform, Square, VGroup

import layout
import parts
import settings
from short import Short, num
from v01_dice import data
from v01_dice import places as P

SCENE = "Dice"
U = settings.STAGE_UNIT
SEVEN = 7


def hill(counts, low: int, lit: int | None = None) -> VGroup:
    colours = [settings.ACCENT_STABLE if low + i == lit else settings.ACCENT_STRUCTURE for i in range(len(counts))]
    columns = parts.bars(counts, P.CHART_X0, P.CHART_X1, P.CHART_Y0, P.CHART_TOP, colours)
    step = (P.CHART_X1 - P.CHART_X0) / len(counts)
    ends = [0, len(counts) - 1] if len(counts) > 11 else range(len(counts))
    names = VGroup(*[
        parts.text(str(low + i), P.LABEL_SIZE, settings.MUTED, (P.CHART_X0 + step * (i + 0.5), P.CHART_LABEL_Y))
        for i in ends
    ])
    return VGroup(columns, names)


def table() -> dict[tuple[int, int], VGroup]:
    cells = {}
    for r in range(1, 7):
        for c in range(1, 7):
            centre = (P.TABLE_X0 + P.CELL * (c - 0.5), P.TABLE_Y1 - P.CELL * (r - 0.5))
            frame = Square(side_length=P.CELL * U).set_stroke(settings.MUTED, P.CELL_STROKE).set_fill(settings.ACCENT_STABLE, 0)
            frame.move_to(layout.S(*centre))
            cells[(r, c)] = VGroup(frame, parts.text(str(r + c), P.SUM_SIZE, settings.INK, centre))
    return cells


def look(cells, bright=None, hot=()) -> list:
    moves = []
    for (r, c), cell in cells.items():
        seen = 1 if bright is None or r + c in bright else P.DIM
        moves.append(cell[0].animate.set_fill(settings.ACCENT_STABLE, P.HOT if r + c in hot else 0).set_stroke(opacity=seen))
        moves.append(cell[1].animate.set_opacity(seen))
    return moves


def stack_at(r: int, c: int):
    total = r + c
    rank = r - max(1, total - 6)
    return layout.S(P.STACK_X0 + P.STACK_STEP * (total - 2) + P.STACK_CELL / 2, P.STACK_Y0 + P.STACK_CELL * (rank + 0.5))


def cube_at(r: int, c: int, layer: int = 0):
    shift = P.CUBE_SHIFT * layer
    return layout.S(P.CUBE_X0 + P.CUBE_CELL * (c - 0.5) + shift, P.CUBE_Y1 - P.CUBE_CELL * (r - 0.5) + shift)


def outline() -> VGroup:
    most = max(data.COUNTS)
    points = []
    for i, count in enumerate(data.COUNTS):
        left = P.STACK_X0 + P.STACK_STEP * i
        top = P.STACK_Y0 + P.STACK_CELL * P.STACK_ROWS * count / most
        points += [(left, P.STACK_Y0), (left, top), (left + P.STACK_CELL, top), (left + P.STACK_CELL, P.STACK_Y0)]
    return parts.path(points, settings.INK, 2.5)


def layers() -> VGroup:
    made = VGroup()
    for layer in range(1, P.CUBE_LAYERS + 1):
        sheet = VGroup(*[
            Square(side_length=P.CUBE_CELL * U).set_stroke(settings.ACCENT_STRUCTURE, P.CELL_STROKE, 1 - P.CUBE_FADE * layer)
            .set_fill(settings.BACKGROUND, 1).move_to(cube_at(r, c, layer))
            for r in range(1, 7) for c in range(1, 7)
        ])
        sheet.set_z_index(-layer)
        made.add(sheet)
    return made


def rays() -> VGroup:
    step = (P.CHART_X1 - P.CHART_X0) / len(data.COUNTS)
    tip = (P.CHART_X0 + step * (SEVEN - 2 + 0.5), P.CHART_TOP + 1)
    gap = (P.RAY_X1 - P.RAY_X0) / (P.RAY_COUNT - 1)
    return VGroup(*[
        parts.line((P.RAY_X0 + gap * i, P.RAY_Y), tip, settings.INK, P.RAY_STROKE) for i in range(P.RAY_COUNT)
    ])


class Dice(Short):
    video = "v01_dice"

    def construct(self):
        v = data.values(self.lang)
        chart = hill(data.COUNTS, 2, SEVEN)
        ask = parts.text("?", P.ASK_SIZE, settings.INK, P.ASK_AT)
        with self.beat("b01") as b:
            self.top("{throws} бросков | {throws} throws", **v)
            self.play(
                LaggedStart(*[GrowFromEdge(bar, DOWN) for bar in chart[0]], lag_ratio=0.25),
                FadeIn(chart[1]),
                run_time=b.share(0.6),
            )
        with self.beat("b02") as b:
            self.play(chart.animate.set_opacity(P.CHART_DIM), FadeIn(ask), run_time=b.share(0.5))

        one = parts.die(P.ONE_AT, P.ONE_SIDE, 1)
        six = parts.bars([1] * 6, P.SIX_X0, P.SIX_X1, P.SIX_Y0, P.SIX_TOP, settings.ACCENT_STRUCTURE)
        step = (P.SIX_X1 - P.SIX_X0) / 6
        digits = VGroup(*[
            parts.text(str(i + 1), P.LABEL_SIZE, settings.MUTED, (P.SIX_X0 + step * (i + 0.5), P.SIX_LABEL_Y)) for i in range(6)
        ])
        with self.beat("b03") as b:
            self.top("1 кубик | 1 die")
            self.play(FadeOut(chart), FadeOut(ask), FadeIn(one), FadeIn(six), FadeIn(digits), run_time=b.share(0.4))
            face = 1
            while self.now() + P.FACE_PERIOD < b.at(0.95):
                self.wait(P.FACE_PERIOD)
                face = face % 6 + 1
                self.remove(one)
                one = parts.die(P.ONE_AT, P.ONE_SIDE, face)
                self.add(one)

        first = parts.die(P.TWO_AT[0], P.ONE_SIDE, 3, settings.ACCENT_CONTRAST)
        second = parts.die(P.TWO_AT[1], P.ONE_SIDE, 4, settings.ACCENT_STRUCTURE)
        with self.beat("b04") as b:
            self.top("2 кубика | 2 dice")
            self.play(FadeOut(six), FadeOut(digits), FadeOut(one), FadeIn(first), FadeIn(second), run_time=b.share(0.5))

        cells = table()
        grid = VGroup(*cells.values())
        shrink = P.EDGE_SIDE / P.ONE_SIDE
        with self.beat("b05") as b:
            self.play(
                first.animate.scale(shrink).move_to(layout.S(*P.FIRST_AT)),
                second.animate.scale(shrink).move_to(layout.S(*P.SECOND_AT)),
                run_time=b.share(0.25),
            )
            self.play(LaggedStart(*[FadeIn(cell) for cell in grid], lag_ratio=0.1), run_time=b.share(0.55))

        hop = Square(side_length=P.CELL * U).set_stroke(settings.INK, P.HOP_STROKE)
        with self.beat("b06") as b:
            self.top("36 клеток | 36 cells")
            self.add(hop)
            for index in data.ORDER:
                if self.now() + 1 / P.HOPS > b.at(0.85):
                    break
                hop.move_to(cells[(index // 6 + 1, index % 6 + 1)])
                self.wait(1 / P.HOPS)
            self.remove(hop)

        with self.beat("b07") as b:
            self.top("сумма 2: {ways2} клетка | sum 2: {ways2} cell", **v)
            self.play(*look(cells, {2}, {2}), run_time=b.share(0.5))
        with self.beat("b08") as b:
            self.top("сумма 3: {ways3} клетки | sum 3: {ways3} cells", **v)
            self.play(*look(cells, {3}, {3}), run_time=b.share(0.5))
        with self.beat("b09") as b:
            lines = [
                ("сумма 4: {n} клетки | sum 4: {n} cells", 4),
                ("сумма 5: {n} клетки | sum 5: {n} cells", 5),
                ("сумма 6: {n} клеток | sum 6: {n} cells", 6),
            ]
            for part, (spec, total) in enumerate(lines):
                moves = self.top_moves(spec, n=num(data.ways(total), self.lang))
                self.play(*moves, *look(cells, {total}, {total}), run_time=b.share(0.14))
                self.hold(b.at((part + 0.8) / 3))
        with self.beat("b10") as b:
            self.top("сумма 7: {ways7} клеток | sum 7: {ways7} cells", **v)
            self.play(*look(cells, {SEVEN}, {SEVEN}), run_time=b.share(0.5))
        with self.beat("b11") as b:
            for part, total in enumerate(range(8, 13)):
                self.play(*look(cells, {total}, {total}), run_time=b.share(0.09))
                self.hold(b.at((part + 0.85) / 5))

        with self.beat("b12") as b:
            self.top("-")
            self.play(*look(cells), FadeOut(first), FadeOut(second), run_time=b.share(0.15))
            self.play(
                *[cell.animate.scale(P.STACK_CELL / P.CELL).move_to(stack_at(r, c)) for (r, c), cell in cells.items()],
                run_time=b.share(0.55),
            )
        edge = outline()
        with self.beat("b13") as b:
            self.play(Create(edge), run_time=b.share(0.6))

        def fade(bright) -> list:
            moves = []
            for (r, c), cell in cells.items():
                seen = 1 if r + c in bright else P.STACK_DIM
                moves += [cell[0].animate.set_stroke(opacity=seen), cell[1].animate.set_opacity(seen)]
            return moves

        share = parts.text(f"{v['ways7']}/{data.CELLS}", P.SHARE_SIZE, settings.INK, P.SHARE_AT)
        with self.beat("b14") as b:
            self.top("{ways7} / 36 | {ways7} / 36", **v)
            self.play(*fade({SEVEN}), edge.animate.set_stroke(opacity=P.STACK_DIM), FadeIn(share), run_time=b.share(0.5))
        with self.beat("b15") as b:
            self.top("7: {ways7} из 36 · 2: {ways2} из 36 | 7: {ways7} of 36 · 2: {ways2} of 36", **v)
            self.play(*fade({SEVEN, 2}), FadeOut(share), run_time=b.share(0.5))

        behind = layers()
        with self.beat("b16") as b:
            self.top("3 кубика: {cells3} клеток | 3 dice: {cells3} cells", **v)
            self.play(
                FadeOut(edge),
                *fade(set(range(2, 13))),
                *[cell[0].animate.set_fill(settings.BACKGROUND, 1).set_stroke(opacity=1) for cell in grid],
                run_time=b.share(0.1),
            )
            self.play(
                *[cell.animate.scale(P.CUBE_CELL / P.STACK_CELL).move_to(cube_at(r, c)) for (r, c), cell in cells.items()],
                run_time=b.share(0.3),
            )
            self.play(LaggedStart(*[FadeIn(sheet) for sheet in behind], lag_ratio=0.5), run_time=b.share(0.3))

        three = hill(data.THREE, 3)
        with self.beat("b17") as b:
            self.play(FadeOut(grid), FadeOut(behind), run_time=b.share(0.2))
            self.play(
                LaggedStart(*[GrowFromEdge(bar, DOWN) for bar in three[0]], lag_ratio=0.2),
                FadeIn(three[1]),
                run_time=b.share(0.45),
            )
        ten = hill(data.TEN, 10)
        with self.beat("b18") as b:
            self.top("10 кубиков | 10 dice")
            self.play(
                ReplacementTransform(three[0], ten[0]),
                FadeOut(three[1]),
                FadeIn(ten[1]),
                run_time=b.share(0.6),
            )
        back = hill(data.COUNTS, 2, SEVEN)
        beams = rays()
        with self.beat("b19") as b:
            self.top("{throws} бросков | {throws} throws", **v)
            self.play(FadeOut(ten), FadeIn(back), run_time=b.share(0.3))
            self.play(LaggedStart(*[Create(beam) for beam in beams], lag_ratio=0.2), run_time=b.share(0.35))
        self.finish()
