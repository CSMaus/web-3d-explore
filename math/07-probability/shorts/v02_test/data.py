import mathx
from short import dec, num

SCREEN = (100000, 0.001, 0.99, 0.05)
SEED = 3
COMMON = 0.1
PER = 1000
PERCENT = 100
PLACES = 2

C = mathx.counted(*SCREEN)
KINDS = mathx.population(*SCREEN, SEED)
C10 = mathx.counted(SCREEN[0], COMMON, SCREEN[2], SCREEN[3])
FALSE = [k for k, kind in enumerate(KINDS) if kind == 1]
SPREAD = [FALSE[i] for i in mathx.shuffle_hats(len(FALSE), mathx.rng_from(SEED))]
ILL = [k for k, kind in enumerate(KINDS) if kind >= 2]


def share_at(per1000: float) -> float:
    return mathx.counted(SCREEN[0], per1000 / PER, SCREEN[2], SCREEN[3]).share


def values(lang: str) -> dict[str, str]:
    return {
        "sens": num(mathx.half_up(SCREEN[2] * PERCENT), lang),
        "people": num(SCREEN[0], lang),
        "ill": num(C.ill, lang),
        "ill_pos": num(C.ill_positive, lang),
        "false_pc": num(mathx.half_up(SCREEN[3] * PERCENT), lang),
        "healthy_pos": num(C.healthy_positive, lang),
        "share": dec(C.share * PERCENT, PLACES, lang),
        "share10": dec(C10.share * PERCENT, PLACES, lang),
    }
