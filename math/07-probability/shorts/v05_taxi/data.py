import mathx
from short import dec, num

COUNT = 10000
SPAN = 50
WAITED = 10
LONG = 20
NARROW = 0.5
BUS_EVERY = 20
WAIT_SEED, BUS_SEED = 4, 5
W_PLACES, BEYOND_PLACES = 1, 3

WAITS = mathx.samples("exponential", COUNT, WAIT_SEED)
BUS = mathx.samples("uniform", COUNT, BUS_SEED)


def bars(values, bins: int) -> list[float]:
    width = SPAN / bins
    return [count / (len(values) * width) for count in mathx.histogram(values, 0, SPAN, bins)]


def values(lang: str) -> dict[str, str]:
    return {
        "mean": num(mathx.MEAN_WAIT, lang),
        "waits": num(COUNT, lang),
        "w": dec(NARROW, W_PLACES, lang),
        "beyond20": dec(mathx.beyond("exponential", LONG), BEYOND_PLACES, lang),
        "still": num(len(mathx.remaining(WAITS, WAITED)), lang),
    }
