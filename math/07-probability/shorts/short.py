import os
from contextlib import contextmanager
from dataclasses import dataclass

from manim import FadeIn, FadeOut, Scene, config

import beats
import layout
import settings
import timeline

settings.apply(settings.quality())

MINUS = "−"
PLACES = 3


class BeatOverrun(Exception):
    pass


@dataclass(frozen=True)
class BeatTime:
    seconds: float
    speech: float
    start: float = 0.0

    def share(self, f: float) -> float:
        return self.seconds * f

    def at(self, f: float) -> float:
        return self.start + self.seconds * f


def pick_top(spec: str, lang: str, **values) -> str | None:
    if spec == "":
        return None
    if spec == "-":
        return ""
    if "|" not in spec:
        raise ValueError(spec)
    halves = [half.strip() for half in spec.split("|", 1)]
    return halves[beats.LANGS.index(lang)].format(**values)


def signed(digits: str, below: bool) -> str:
    return f"{MINUS}{digits}" if below else digits


def num(n: int, lang: str) -> str:
    gap = {"ru": " ", "en": ","}[lang]
    return signed(f"{abs(n):,}".replace(",", gap), n < 0)


def dec(v: float, places: int, lang: str) -> str:
    point = {"ru": ",", "en": "."}[lang]
    digits = f"{abs(v):.{places}f}"
    return signed(digits.replace(".", point), v < 0 and float(digits) != 0)


class Short(Scene):
    video = ""

    def setup(self):
        self.lang = os.getenv(settings.LANG_ENV, beats.LANGS[0])
        self.timeline = timeline.load_or_build(self.video, self.lang)
        title, _ = beats.load(self.video)
        name = layout.label(title[self.lang], settings.TITLE_H, settings.MUTED)
        self.add(layout.fit_width(name, settings.TOP_MAX_W).move_to([0, settings.TITLE_Y, 0]))
        self.line = None

    def now(self) -> float:
        return self.time

    def frame(self) -> float:
        return 1 / config.frame_rate

    def hold(self, until: float) -> None:
        gap = until - self.now()
        if gap >= self.frame():
            self.wait(gap)

    @contextmanager
    def beat(self, id: str):
        slot = self.timeline[id]
        self.hold(slot.start)
        length = round(slot.end - slot.start, PLACES)
        yield BeatTime(seconds=length, speech=slot.speech, start=slot.start)
        if self.now() - slot.end > self.frame():
            took = self.now() - slot.start
            raise BeatOverrun(f"{id}: animations took {took:.2f} s, the beat has {length:.2f} s")
        self.hold(slot.end)

    def top_line(self, words: str):
        if not words:
            return None
        fresh = layout.label(words, settings.TOP_H, settings.INK)
        return layout.fit_width(fresh, settings.TOP_MAX_W).move_to([0, settings.TOP_Y, 0])

    def top_moves(self, spec: str, **values) -> list:
        words = pick_top(spec, self.lang, **values)
        if words is None:
            return []
        moves = []
        if self.line is not None:
            moves.append(FadeOut(self.line))
        self.line = self.top_line(words)
        if self.line is not None:
            moves.append(FadeIn(self.line))
        return moves

    def top(self, spec: str, **values) -> None:
        moves = self.top_moves(spec, **values)
        if moves:
            self.play(*moves, run_time=settings.TOP_FADE)

    def top_now(self, spec: str, **values) -> None:
        words = pick_top(spec, self.lang, **values)
        if words is None:
            return
        if self.line is not None:
            self.remove(self.line)
        self.line = self.top_line(words)
        if self.line is not None:
            self.add(self.line)

    def finish(self) -> None:
        self.hold(self.timeline.total)
