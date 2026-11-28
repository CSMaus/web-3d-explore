from functools import lru_cache

import numpy as np
from manim import Rectangle, Text

import settings


def S(x: float, y: float) -> np.ndarray:
    return np.array([
        settings.STAGE_X0 + x * settings.STAGE_UNIT,
        settings.STAGE_Y0 + y * settings.STAGE_UNIT,
        0.0,
    ])


def stage_rect() -> Rectangle:
    rect = Rectangle(
        width=settings.STAGE_W * settings.STAGE_UNIT,
        height=settings.STAGE_H * settings.STAGE_UNIT,
    )
    rect.move_to(S(settings.STAGE_W / 2, settings.STAGE_H / 2))
    return rect


def fit_width(mobject, most: float):
    if mobject.width > most:
        mobject.scale_to_fit_width(most)
    return mobject


@lru_cache(maxsize=None)
def probe_height() -> float:
    return Text(settings.TEXT_PROBE).height


def label(words: str, height: float, colour: str) -> Text:
    return Text(words, color=colour).scale(height / probe_height())
