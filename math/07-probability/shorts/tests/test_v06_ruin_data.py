from v06_ruin import data


def test_russian():
    assert data.values("ru") == {
        "start": "10",
        "goal": "20",
        "pc": "49",
        "reach_pc": "40",
        "bets": "99",
        "fair_wins": "50",
        "unfair_wins": "40",
    }


def test_one_game():
    assert len(data.ONE_UNFAIR) == 91
    assert data.ONE_UNFAIR[-1] == 20


def test_hundred_games():
    for games in (data.FAIR, data.UNFAIR):
        assert len(games) == 100
        for path in games:
            assert path[0] == 10
            assert path[-1] in (0, 20)
