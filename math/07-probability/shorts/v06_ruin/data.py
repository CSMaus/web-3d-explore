import mathx
from short import num

START = 10
GOAL = 20
P = 0.49
EVEN = 0.5
ONE_SEED = 81
SEEDS = range(5600, 5700)
PER_CENT = 100


def game(p: float, seed: int) -> list[int]:
    return mathx.play_ruin(START, GOAL, p, mathx.rng_from(seed), keep=True).path


ONE_FAIR = game(EVEN, ONE_SEED)
ONE_UNFAIR = game(P, ONE_SEED)
FAIR = [game(EVEN, seed) for seed in SEEDS]
UNFAIR = [game(P, seed) for seed in SEEDS]


def wins(paths) -> int:
    return sum(1 for path in paths if path[-1] >= GOAL)


def values(lang: str) -> dict[str, str]:
    return {
        "start": num(START, lang),
        "goal": num(GOAL, lang),
        "pc": num(round(P * PER_CENT), lang),
        "reach_pc": num(round(mathx.reach_chance(START, GOAL, P) * PER_CENT), lang),
        "bets": num(round(mathx.expected_bets(START, GOAL, P)), lang),
        "fair_wins": num(wins(FAIR), lang),
        "unfair_wins": num(wins(UNFAIR), lang),
    }
