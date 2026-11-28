import math

import pytest

import mathx


def test_rng_start():
    rng = mathx.rng_from(1)
    got = [rng() for _ in range(3)]
    assert got == pytest.approx([0.6270739406, 0.0027357212, 0.5274470400], abs=5e-11)


def test_rng_zero_seed():
    assert mathx.rng_from(0)() == mathx.rng_from(1)()


def test_throws():
    rng = mathx.rng_from(7)
    pairs = [mathx.throw_two(rng) for _ in range(5000)]
    sums = [sum(1 for a, b in pairs if a + b == s) for s in range(2, 13)]
    assert sums == [137, 285, 411, 568, 713, 803, 745, 566, 393, 258, 121]
    assert pairs[:5] == [(1, 1), (6, 5), (4, 3), (3, 2), (4, 5)]


def test_sum_ways():
    assert [mathx.sum_ways(s) for s in range(1, 14)] == [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 0]


@pytest.mark.parametrize("seed, total", [(5, -580), (6, -250)])
def test_thousand_rounds(seed, total):
    rng = mathx.rng_from(seed)
    assert sum(mathx.round_gain(rng).gain for _ in range(1000)) == total


def test_twelve_players():
    totals = []
    for seed in range(41, 53):
        rng = mathx.rng_from(seed)
        totals.append(sum(mathx.round_gain(rng).gain for _ in range(20)))
    assert totals == [0, -10, 10, -10, 0, -10, -40, -30, -10, -10, 10, -30]


def test_expected_gain():
    assert mathx.expected_gain() == pytest.approx(-1 / 3)


def test_counted():
    c = mathx.counted(100000, 0.001, 0.99, 0.05)
    assert (c.ill, c.ill_positive, c.healthy_positive) == (100, 99, 4995)
    assert c.share == pytest.approx(99 / 5094)


def test_population():
    kinds = mathx.population(100000, 0.001, 0.99, 0.05, 3)
    assert [kinds.count(k) for k in range(4)] == [94905, 4995, 1, 99]
    assert kinds != sorted(kinds, reverse=True)


def test_hats():
    assert mathx.matches(mathx.shuffle_hats(100, mathx.rng_from(61))) == 1


def test_waits():
    waits = mathx.samples("exponential", 10000, 4)
    assert mathx.share_above(waits, 20) == pytest.approx(0.1306, abs=1e-9)
    assert sum(1 for w in waits if w > 10) == 3692
    assert mathx.mean(mathx.remaining(waits, 10)) == pytest.approx(9.992, abs=5e-4)


def test_shapes():
    assert mathx.density("exponential", 0) == pytest.approx(0.1)
    assert mathx.density("uniform", 5) == pytest.approx(0.05)
    assert mathx.beyond("exponential", 10) == pytest.approx(math.exp(-1))
    assert mathx.beyond("uniform", 5) == pytest.approx(0.75)
    assert all(0 <= w < 20 for w in mathx.samples("uniform", 500, 2))
    with pytest.raises(ValueError):
        mathx.sample("normal", mathx.rng_from(1))


def test_histogram():
    assert mathx.histogram([0, 1, 1.5, 3.9, 4, -1], 0, 4, 4) == [1, 2, 0, 1]
    assert mathx.histogram([0, 1, 1.5, 3.9], 0, 4, 4, 2) == [1, 1, 0, 0]


@pytest.mark.parametrize("p, wins", [(0.5, 50), (0.49, 40)])
def test_ruin_hundred(p, wins):
    games = [mathx.play_ruin(10, 20, p, mathx.rng_from(s)) for s in range(5600, 5700)]
    assert sum(1 for g in games if g.won) == wins


def test_ruin_one():
    game = mathx.play_ruin(10, 20, 0.49, mathx.rng_from(81), keep=True)
    assert game.won and game.bets == 90
    assert len(game.path) == 91 and game.path[0] == 10 and game.path[-1] == 20


def test_ruin_exact():
    assert mathx.reach_chance(10, 20, 0.49) == pytest.approx(0.4013, abs=5e-5)
    assert mathx.expected_bets(10, 20, 0.49) == pytest.approx(98.70, abs=5e-3)
    assert mathx.reach_chance(10, 20, 0.5) == 0.5
    assert mathx.expected_bets(10, 20, 0.5) == 100


def test_calls():
    rng = mathx.rng_from(11)
    at = -math.log(1 - rng()) / 3
    calls = []
    while at < 20:
        calls.append(at)
        at += -math.log(1 - rng()) / 3
    assert len(calls) == 69
    busy = {math.floor(t) for t in calls}
    assert [minute for minute in range(20) if minute not in busy] == [9]


def test_board():
    rng = mathx.rng_from(9)
    bins = [0] * 13
    for _ in range(2000):
        bins[mathx.drop_ball(12, 0.5, rng).bin] += 1
    assert bins == [0, 9, 35, 112, 224, 389, 481, 409, 222, 95, 21, 3, 0]


def test_binomial():
    assert mathx.choose(12, 6) == 924
    assert sum(mathx.binomial(12, k, 0.5) for k in range(13)) == pytest.approx(1)


def test_dice_sums():
    three = mathx.dice_sums(3)
    assert three == [1, 3, 6, 10, 15, 21, 25, 27, 27, 25, 21, 15, 10, 6, 3, 1]
    assert sum(three) == 216
    ten = mathx.dice_sums(10)
    assert len(ten) == 51 and max(ten) == 4395456
    assert mathx.dice_sums(2) == [mathx.sum_ways(s) for s in range(2, 13)]
