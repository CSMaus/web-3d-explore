import mathx
from v05_taxi import data


def test_russian():
    v = data.values("ru")
    assert set(v) == {"mean", "waits", "w", "beyond20", "still"}
    assert v["waits"] == "10 000"
    assert v["beyond20"] == "0,135"
    assert v["still"] == "3 692"
    assert v["w"] == "0,5"
    assert v["mean"] == "10"


def test_remainder():
    assert 9.9 < mathx.mean(mathx.remaining(data.WAITS, 10)) < 10.1


def test_bars():
    for bins in (10, 25, 50, 100):
        assert len(data.bars(data.WAITS, bins)) == bins
