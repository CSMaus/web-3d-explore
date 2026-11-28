from v03_game import data


def test_russian():
    v = data.values("ru")
    assert v["total1000"] == "−250"
    assert v["mean"] == "−0,333"
    assert v["mean_fair"] == "0,000"
    assert v["net"] == "−2"
    assert (v["cost"], v["prize"], v["paid"], v["fair"]) == ("2", "10", "12", "12")


def test_players():
    totals = [data.score(faces, data.PRIZE)[data.FEW] for faces in data.PLAYERS]
    assert totals == [0, -10, 10, -10, 0, -10, -40, -30, -10, -10, 10, -30]
    assert sum(1 for total in totals if total > 0) == 2
    assert all(data.score(faces, data.PRIZE)[-1] < 0 for faces in data.PLAYERS)


def test_one():
    assert len(data.ONE) == 1001 and data.ONE[0] == 0 and data.ONE[-1] == -250
    assert all(len(faces) == 1000 for faces in data.PLAYERS)
