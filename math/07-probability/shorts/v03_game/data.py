import mathx
from short import dec, num

COST = 2
PRIZE = 10
FAIR = 12
ROUNDS = 1000
FEW = 20
ONE_SEED = 6
SEEDS = range(41, 53)
PLACES = 3


def thrown(seed: int) -> list[int]:
    rng = mathx.rng_from(seed)
    return [1 + mathx.pick(rng, mathx.FACES) for _ in range(ROUNDS)]


def score(faces, prize: int) -> list[int]:
    out = [0]
    for face in faces:
        out.append(out[-1] + (prize if face == mathx.FACES else 0) - COST)
    return out


ONE = score(thrown(ONE_SEED), PRIZE)
PLAYERS = [thrown(seed) for seed in SEEDS]


def values(lang: str) -> dict[str, str]:
    paid = mathx.FACES * COST
    return {
        "cost": num(COST, lang),
        "prize": num(PRIZE, lang),
        "paid": num(paid, lang),
        "net": num(PRIZE - paid, lang),
        "mean": dec(mathx.expected_gain(PRIZE, COST), PLACES, lang),
        "total1000": num(ONE[-1], lang),
        "fair": num(FAIR, lang),
        "mean_fair": dec(mathx.expected_gain(FAIR, COST), PLACES, lang),
    }
