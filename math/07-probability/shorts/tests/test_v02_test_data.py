import pytest

from v02_test import data


def test_russian():
    v = data.values("ru")
    assert v["people"] == "100 000"
    assert v["ill"] == "100"
    assert v["ill_pos"] == "99"
    assert v["healthy_pos"] == "4 995"
    assert v["share"] == "1,94"
    assert v["share10"] == "68,75"
    assert (v["sens"], v["false_pc"]) == ("99", "5")


def test_english():
    v = data.values("en")
    assert v["healthy_pos"] == "4,995"
    assert v["share"] == "1.94"


def test_arrays():
    assert len(data.KINDS) == 100000
    assert len(data.ILL) == 100 and len(data.SPREAD) == 4995
    assert sorted(data.SPREAD) == data.FALSE
    assert data.share_at(1) == pytest.approx(data.C.share)
    assert data.share_at(100) == pytest.approx(data.C10.share)
