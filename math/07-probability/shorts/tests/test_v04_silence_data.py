from v04_silence import data


def test_english():
    v = data.values("en")
    assert v["p6"] == "0.0156"
    assert v["p60"] == "0.0461"
    assert v["p600"] == "0.0494"
    assert v["p6000"] == "0.0497"
    assert v["limit"] == "0.0498"
    assert v["inv_e"] == "0.3679"
    assert v["e"] == "2.718"
    assert v["mean"] == "3"


def test_russian():
    assert data.values("ru")["e"] == "2,718"


def test_arrays():
    assert len(data.CALLS) == 69
    assert data.SILENT == [9]
    assert [len(data.SLICES[n]) for n in data.SHOWN] == [6, 60]
    assert [mean for mean, _ in data.LINES] == [0.5, 2, 5]
    assert all(0 <= t < data.ROW for _, moments in data.LINES for t in moments)
