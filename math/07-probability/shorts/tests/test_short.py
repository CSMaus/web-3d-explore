import numpy as np
import pytest

import raster
import settings
import short
import timeline


def test_pick_top():
    assert short.pick_top("{n} бросков | {n} throws", "en", n="5 000") == "5 000 throws"
    assert short.pick_top("{n} бросков | {n} throws", "ru", n="5 000") == "5 000 бросков"
    assert short.pick_top("", "ru") is None
    assert short.pick_top("-", "en") == ""
    with pytest.raises(ValueError):
        short.pick_top("бросков", "ru")


def test_share():
    assert short.BeatTime(seconds=3.0, speech=2.2).share(0.5) == 1.5


def test_numbers():
    assert short.num(5000, "ru") == "5 000"
    assert short.num(100000, "en") == "100,000"
    assert short.num(-580, "ru") == "−580"
    assert short.dec(0.135, 3, "ru") == "0,135"
    assert short.dec(-1 / 3, 3, "en") == "−0.333"
    assert short.dec(-0.0001, 3, "en") == "0.000"


def test_paint():
    palette = [settings.BACKGROUND, settings.ACCENT_MATH, settings.ACCENT_CONTRAST, settings.ACCENT_STABLE]
    colours = raster.paint([0, 1, 2, 3, 0, 1], palette, 3)
    assert colours.shape == (2, 3, 3)
    assert colours.dtype == np.uint8
    want = [[palette[0], palette[1], palette[2]], [palette[3], palette[0], palette[1]]]
    for row in range(2):
        for col in range(3):
            assert tuple(colours[row, col]) == raster.rgb(want[row][col])
    assert raster.rgb("#FFC857") == (255, 200, 87)


def test_paint_tail():
    colours = raster.paint([1, 1, 1, 1], [settings.INK, settings.ACCENT_MATH], 3)
    assert colours.shape == (2, 3, 3)
    assert tuple(colours[1, 2]) == raster.rgb(settings.BACKGROUND)


def test_field():
    image = raster.field(raster.paint([0, 1, 1, 0], [settings.INK, settings.MUTED], 2), 4.0)
    assert image.width == pytest.approx(4.0)
    assert image.height == pytest.approx(4.0)


class Clocked(short.Short):
    video = "probe"

    def __init__(self):
        super().__init__()
        self.clock = 0.0
        slot = timeline.Slot("b01", "Раз.", 0.4, 0.65, 1.4)
        self.timeline = timeline.Timeline("probe", "ru", (slot,), 2.2)

    def now(self):
        return self.clock

    def wait(self, duration=1.0, **rest):
        self.clock += duration


def test_overrun():
    scene = Clocked()
    with pytest.raises(short.BeatOverrun) as failure:
        with scene.beat("b01"):
            scene.clock += 3.0
    assert str(failure.value) == "b01: animations took 3.00 s, the beat has 1.00 s"


def test_beat_waits():
    scene = Clocked()
    with scene.beat("b01") as b:
        assert scene.clock == pytest.approx(0.4)
        assert (b.seconds, b.speech) == (1.0, 0.65)
        scene.clock += 0.6
    assert scene.clock == pytest.approx(1.4)
    scene.finish()
    assert scene.clock == pytest.approx(2.2)
