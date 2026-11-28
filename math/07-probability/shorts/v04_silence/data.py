import math

import mathx
from short import dec, num

MEAN = 3
MINUTES = 20
SEED = 11
CUTS = (6, 60, 600, 6000)
SHOWN = (6, 60)
ROW = 10
OTHERS = ((0.5, 12), (2, 13), (5, 14))
PLACES = 4
E_PLACES = 3


def calls(mean: float, seed: int, span: float) -> list[float]:
    rng = mathx.rng_from(seed)
    at = -math.log(1 - rng()) / mean
    out = []
    while at < span:
        out.append(at)
        at += -math.log(1 - rng()) / mean
    return out


def quiet(moments, span: int) -> list[int]:
    busy = {math.floor(t) for t in moments}
    return [minute for minute in range(span) if minute not in busy]


def silence(n: float, mean: float) -> float:
    return (1 - mean / n) ** n


def sliced(n: int, mean: float = MEAN) -> list[bool]:
    rng = mathx.rng_from(n)
    return [rng() < mean / n for _ in range(n)]


CALLS = calls(MEAN, SEED, MINUTES)
SILENT = quiet(CALLS, MINUTES)
SLICES = {n: sliced(n) for n in SHOWN}
LINES = [(mean, calls(mean, seed, ROW)) for mean, seed in OTHERS]


def values(lang: str) -> dict[str, str]:
    made = {f"p{n}": dec(silence(n, MEAN), PLACES, lang) for n in CUTS}
    made |= {
        "mean": num(MEAN, lang),
        "limit": dec(math.exp(-MEAN), PLACES, lang),
        "inv_e": dec(math.exp(-1), PLACES, lang),
        "e": dec(math.e, E_PLACES, lang),
    }
    return made
