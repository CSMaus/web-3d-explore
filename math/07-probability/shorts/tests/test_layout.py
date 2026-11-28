import pytest
from manim import Square

import layout
import settings


@pytest.mark.parametrize("point, place", [
    ((0, 0), (-2.0, -1.4, 0)),
    ((100, 97.5), (2.0, 2.5, 0)),
    ((50, 48.75), (0, 0.55, 0)),
])
def test_stage_point(point, place):
    assert layout.S(*point) == pytest.approx(place, abs=1e-9)


def test_stage_frame():
    rect = layout.stage_rect()
    assert rect.width == pytest.approx(4.0)
    assert rect.height == pytest.approx(3.9)
    assert rect.get_center() == pytest.approx((0, 0.55, 0), abs=1e-9)


def test_fit_narrows():
    wide = layout.fit_width(Square(side_length=6), settings.TOP_MAX_W)
    assert wide.width == pytest.approx(settings.TOP_MAX_W)


def test_fit_keeps():
    small = layout.fit_width(Square(side_length=1), settings.TOP_MAX_W)
    assert small.width == pytest.approx(1)


def test_label_height():
    probe = layout.label(settings.TEXT_PROBE, settings.TOP_H, settings.INK)
    assert probe.height == pytest.approx(settings.TOP_H, rel=1e-6)
