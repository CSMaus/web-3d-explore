import numpy as np
from manim import ImageMobject
from manim.constants import RESAMPLING_ALGORITHMS

import settings


def rgb(colour: str) -> tuple[int, int, int]:
    digits = colour.lstrip("#")
    return tuple(int(digits[i:i + 2], 16) for i in (0, 2, 4))


def paint(kinds, palette, cols: int) -> np.ndarray:
    kinds = np.asarray(kinds, dtype=np.intp)
    rows = -(-len(kinds) // cols)
    out = np.empty((rows * cols, 3), dtype=np.uint8)
    out[:] = rgb(settings.BACKGROUND)
    out[:len(kinds)] = np.array([rgb(c) for c in palette], dtype=np.uint8)[kinds]
    return out.reshape(rows, cols, 3)


def field(colours: np.ndarray, width: float) -> ImageMobject:
    image = ImageMobject(np.asarray(colours, dtype=np.uint8))
    image.set_resampling_algorithm(RESAMPLING_ALGORITHMS["nearest"])
    image.scale(width / image.width)
    return image
