import math
from typing import Callable, NamedTuple, Sequence

Rng = Callable[[], float]

MASK = 0xFFFFFFFF
RNG_STEP = 0x6D2B79F5
RNG_SPAN = 4294967296
FACES = 6
DICE_LOW, DICE_HIGH, DICE_MID = 2, 12, 7
PRIZE, COST = 10, 2
MEAN_WAIT = 10
EVEN = 0.5
EVEN_GAP = 1e-12
SHAPES = ("exponential", "uniform")


class Count(NamedTuple):
    ill: int
    healthy: int
    ill_positive: int
    healthy_positive: int
    positive: int
    share: float


class Round(NamedTuple):
    face: int
    gain: int


class Drop(NamedTuple):
    bin: int
    path: list[int]


class Ruin(NamedTuple):
    won: bool
    bets: int
    path: list[int]


def imul(a: int, b: int) -> int:
    return (a * b) & MASK


def rng_from(seed: int) -> Rng:
    state = (int(seed) & MASK) or 1

    def rng() -> float:
        nonlocal state
        state = (state + RNG_STEP) & MASK
        t = state
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & MASK
        return ((t ^ (t >> 14)) & MASK) / RNG_SPAN

    return rng


def half_up(value: float) -> int:
    return math.floor(value + 0.5)


def pick(rng: Rng, n: int) -> int:
    return min(n - 1, math.floor(rng() * n))


def sum_ways(total: int) -> int:
    if total < DICE_LOW or total > DICE_HIGH:
        return 0
    return FACES - abs(total - DICE_MID)


def throw_two(rng: Rng) -> tuple[int, int]:
    first = 1 + pick(rng, FACES)
    second = 1 + pick(rng, FACES)
    return first, second


def dice_sums(n: int) -> list[int]:
    ways = [1]
    for _ in range(n):
        wider = [0] * (len(ways) + FACES - 1)
        for at, count in enumerate(ways):
            for face in range(FACES):
                wider[at + face] += count
        ways = wider
    return ways


def counted(people: int, prevalence: float, sensitivity: float, false_positive: float) -> Count:
    ill = half_up(people * prevalence)
    healthy = people - ill
    ill_positive = half_up(ill * sensitivity)
    healthy_positive = half_up(healthy * false_positive)
    positive = ill_positive + healthy_positive
    share = ill_positive / positive if positive else 0
    return Count(ill, healthy, ill_positive, healthy_positive, positive, share)


def population(people: int, prevalence: float, sensitivity: float, false_positive: float, seed: int) -> list[int]:
    c = counted(people, prevalence, sensitivity, false_positive)
    kinds = (
        [3] * c.ill_positive
        + [2] * (c.ill - c.ill_positive)
        + [1] * c.healthy_positive
        + [0] * (c.healthy - c.healthy_positive)
    )
    rng = rng_from(seed)
    for i in range(len(kinds) - 1, 0, -1):
        j = pick(rng, i + 1)
        kinds[i], kinds[j] = kinds[j], kinds[i]
    return kinds


def round_gain(rng: Rng, prize: int = PRIZE, cost: int = COST) -> Round:
    face = 1 + pick(rng, FACES)
    return Round(face, (prize if face == FACES else 0) - cost)


def expected_gain(prize: int = PRIZE, cost: int = COST) -> float:
    return prize / FACES - cost


def shuffle_hats(n: int, rng: Rng) -> list[int]:
    hats = list(range(n))
    for i in range(n - 1, 0, -1):
        j = pick(rng, i + 1)
        hats[i], hats[j] = hats[j], hats[i]
    return hats


def matches(hats: Sequence[int]) -> int:
    return sum(1 for i, hat in enumerate(hats) if hat == i)


def choose(n: int, k: int) -> float:
    if k < 0 or k > n:
        return 0
    c = 1
    for j in range(1, min(k, n - k) + 1):
        c = (c * (n - j + 1)) / j
    return c


def binomial(n: int, k: int, p: float) -> float:
    return choose(n, k) * p ** k * (1 - p) ** (n - k)


def drop_ball(rows: int, p: float, rng: Rng) -> Drop:
    at = 0
    path = [0]
    for _ in range(rows):
        if rng() < p:
            at += 1
        path.append(at)
    return Drop(at, path)


def known(shape: str) -> str:
    if shape not in SHAPES:
        raise ValueError(shape)
    return shape


def sample(shape: str, rng: Rng, mean: float = MEAN_WAIT) -> float:
    if known(shape) == "exponential":
        return -mean * math.log(1 - rng())
    return 2 * mean * rng()


def samples(shape: str, n: int, seed: int) -> list[float]:
    rng = rng_from(seed)
    return [sample(shape, rng) for _ in range(n)]


def density(shape: str, x: float, mean: float = MEAN_WAIT) -> float:
    if known(shape) == "exponential":
        return 0 if x < 0 else math.exp(-x / mean) / mean
    return 0 if x < 0 or x > 2 * mean else 1 / (2 * mean)


def beyond(shape: str, t: float, mean: float = MEAN_WAIT) -> float:
    if known(shape) == "exponential":
        return 1 if t < 0 else math.exp(-t / mean)
    if t <= 0:
        return 1
    return 0 if t >= 2 * mean else 1 - t / (2 * mean)


def histogram(values: Sequence[float], lo: float, hi: float, bins: int, up_to: int | None = None) -> list[int]:
    out = [0] * bins
    width = (hi - lo) / bins
    for v in values[:len(values) if up_to is None else up_to]:
        if v < lo or v >= hi:
            continue
        out[min(bins - 1, math.floor((v - lo) / width))] += 1
    return out


def share_above(values: Sequence[float], t: float, up_to: int | None = None) -> float:
    span = len(values) if up_to is None else up_to
    above = sum(1 for v in values[:span] if v > t)
    return above / span if span else 0


def remaining(values: Sequence[float], t: float) -> list[float]:
    return [v - t for v in values if v > t]


def mean(values: Sequence[float]) -> float:
    total = 0.0
    for v in values:
        total += v
    return total / len(values) if len(values) else 0


def reach_chance(start: int, target: int, p: float) -> float:
    if start <= 0:
        return 0
    if start >= target:
        return 1
    if abs(p - EVEN) < EVEN_GAP:
        return start / target
    r = (1 - p) / p
    return (1 - r ** start) / (1 - r ** target)


def expected_bets(start: int, target: int, p: float) -> float:
    if start <= 0 or start >= target:
        return 0
    if abs(p - EVEN) < EVEN_GAP:
        return start * (target - start)
    q = 1 - p
    return start / (q - p) - (target / (q - p)) * reach_chance(start, target, p)


def play_ruin(start: int, target: int, p: float, rng: Rng, keep: bool = False) -> Ruin:
    at = start
    bets = 0
    path = [at] if keep else []
    while 0 < at < target:
        at += 1 if rng() < p else -1
        bets += 1
        if keep:
            path.append(at)
    return Ruin(at >= target, bets, path)
