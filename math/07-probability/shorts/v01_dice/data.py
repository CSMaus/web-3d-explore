import mathx
from short import num

THROWS = 5000
SEED = 7
SUMS = list(range(mathx.DICE_LOW, mathx.DICE_HIGH + 1))
CELLS = mathx.FACES * mathx.FACES


def thrown() -> list[int]:
    rng = mathx.rng_from(SEED)
    counts = [0] * len(SUMS)
    for _ in range(THROWS):
        first, second = mathx.throw_two(rng)
        counts[first + second - mathx.DICE_LOW] += 1
    return counts


COUNTS = thrown()
WAYS = [mathx.sum_ways(s) for s in SUMS]
THREE = mathx.dice_sums(3)
TEN = mathx.dice_sums(10)
ORDER = mathx.shuffle_hats(CELLS, mathx.rng_from(SEED))


def ways(total: int) -> int:
    return WAYS[total - mathx.DICE_LOW]


def values(lang: str) -> dict[str, str]:
    return {
        "throws": num(THROWS, lang),
        "ways2": num(ways(2), lang),
        "ways3": num(ways(3), lang),
        "ways6": num(ways(6), lang),
        "ways7": num(ways(7), lang),
        "cells3": num(sum(THREE), lang),
    }
