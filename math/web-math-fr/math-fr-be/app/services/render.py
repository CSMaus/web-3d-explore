import base64
import io
import re
from functools import lru_cache

import numpy as np
from PIL import Image

from app.core.config import settings

RAMP_STOPS = ("#1e1440", "#4a2a8c", "#8a3ab8", "#c75ab0", "#f0bee0")
BODY = "#58c4dd"
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")


def rgb(value: str) -> tuple[int, int, int]:
    h = value.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def ramp(stops: tuple[str, ...], bands: int) -> np.ndarray:
    cols = np.array([rgb(s) for s in stops], dtype=float)
    idx = np.linspace(0, len(cols) - 1, bands)
    lo = np.floor(idx).astype(int)
    hi = np.minimum(lo + 1, len(cols) - 1)
    t = (idx - lo).reshape(-1, 1)
    return (cols[lo] * (1 - t) + cols[hi] * t).astype(np.uint8)


BANDS = 256


def colour(value: str | None, fallback: str) -> str:
    text = str(value or "")
    return text if HEX.match(text) else fallback


def stops(given: object) -> tuple[str, ...]:
    """the requested ramp, or the default one if it is not a usable list of colours."""
    if not isinstance(given, (list, tuple)) or len(given) < 2:
        return RAMP_STOPS
    kept = tuple(c for c in (colour(str(x), "") for x in given) if c)
    return kept if len(kept) >= 2 else RAMP_STOPS


@lru_cache(maxsize=32)
def table(which: tuple[str, ...]) -> np.ndarray:
    return ramp(which, BANDS)


TABLE = table(RAMP_STOPS)


def too_much(width: int, height: int, iters: int) -> str | None:
    if width < 1 or width > settings.limit.max_width:
        return "width out of range"
    if height < 1 or height > settings.limit.max_height:
        return "height out of range"
    if iters < 1 or iters > settings.limit.max_iters:
        return "iteration count out of range"
    if width * height * iters > settings.limit.max_work:
        return "that render is larger than the budget allows"
    return None


def counts(cx: float, cy: float, span: float, width: int, height: int, iters: int) -> np.ndarray:
    ratio = height / width
    xs = np.linspace(cx - span, cx + span, width, dtype=np.float64)
    ys = np.linspace(cy + span * ratio, cy - span * ratio, height, dtype=np.float64)
    c = xs[None, :] + 1j * ys[:, None]
    z = np.zeros_like(c)
    out = np.full(c.shape, -1, dtype=np.int32)
    alive = np.ones(c.shape, dtype=bool)
    for n in range(iters):
        z[alive] = z[alive] * z[alive] + c[alive]
        gone = alive & (np.abs(z) > 2.0)
        out[gone] = n + 1
        alive &= ~gone
        if not alive.any():
            break
    return out


def paint(
    field: np.ndarray,
    iters: int,
    which: tuple[str, ...] = RAMP_STOPS,
    body: str = BODY,
    shift: float = 0.0,
) -> np.ndarray:
    inside = field < 0
    frac = np.clip(field.astype(float) / iters, 0, 1) ** 0.45
    # the colour offset slider walks the ramp round, so it wraps rather than
    # clamping, exactly as the shader on the page does
    frac = np.mod(frac + shift, 1.0)
    idx = (frac * (BANDS - 1)).astype(int)
    arr = table(which)[idx]
    arr[inside] = rgb(colour(body, BODY))
    return arr


def as_png(arr: np.ndarray) -> str:
    buf = io.BytesIO()
    Image.fromarray(arr, mode="RGB").save(buf, format="PNG", optimize=False)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def tile(
    cx: float,
    cy: float,
    span: float,
    width: int,
    height: int,
    iters: int,
    which: tuple[str, ...] = RAMP_STOPS,
    body: str = BODY,
    shift: float = 0.0,
) -> str:
    return as_png(paint(counts(cx, cy, span, width, height, iters), iters, which, body, shift))
