from v01_dice import data


def test_values():
    assert data.values("ru") == {"throws": "5 000", "ways2": "1", "ways3": "2", "ways6": "5", "ways7": "6", "cells3": "216"}
    assert data.values("en")["throws"] == "5,000"


def test_arrays():
    assert data.COUNTS == [137, 285, 411, 568, 713, 803, 745, 566, 393, 258, 121]
    assert data.WAYS == [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]
    assert len(data.THREE) == 16 and len(data.TEN) == 51
    assert sorted(data.ORDER) == list(range(36))
