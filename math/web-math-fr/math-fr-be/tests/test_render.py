import numpy as np

from app.services.render import counts, paint, tile, too_much


def test_the_budget_refuses_the_oversized():
    assert too_much(4096, 4096, 100000) is not None
    assert too_much(0, 100, 100) is not None
    assert too_much(640, 640, 400) is None


def test_the_body_is_marked_inside():
    field = counts(-0.6, 0.0, 1.6, 64, 64, 120)
    assert (field < 0).any()
    assert (field > 0).any()


def test_paint_gives_three_channels():
    field = counts(-0.6, 0.0, 1.6, 32, 32, 60)
    arr = paint(field, 60)
    assert arr.shape == (32, 32, 3)
    assert arr.dtype == np.uint8


def test_a_tile_is_a_png():
    import base64

    raw = base64.b64decode(tile(-0.6, 0.0, 1.6, 32, 32, 60))
    assert raw[:8] == b"\x89PNG\r\n\x1a\n"


def test_a_requested_ramp_is_used():
    from app.services import render

    field = np.array([[0, 5], [-1, 10]], dtype=np.int32)
    warm = render.paint(field, 10, ("#ff0000", "#00ff00"), "#0000ff")
    cool = render.paint(field, 10, ("#000010", "#0000ff"), "#ffffff")
    assert warm.tolist() != cool.tolist()
    # the inside of the set takes the body colour, exactly
    assert tuple(warm[1][0]) == (0, 0, 255)
    assert tuple(cool[1][0]) == (255, 255, 255)


def test_a_bad_ramp_falls_back_rather_than_failing():
    from app.services import render

    assert render.stops(None) == render.RAMP_STOPS
    assert render.stops(["nonsense", "also nonsense"]) == render.RAMP_STOPS
    assert render.stops(["#112233"]) == render.RAMP_STOPS
    assert render.stops(["#112233", "#445566"]) == ("#112233", "#445566")
    assert render.stops(["#112233", "drop me", "#445566"]) == ("#112233", "#445566")
    assert render.colour("javascript:alert(1)", render.BODY) == render.BODY
    assert render.colour("#ABCdef", render.BODY) == "#ABCdef"


def test_the_ramp_table_is_built_once_a_palette():
    from app.services import render

    render.table.cache_clear()
    render.table(("#000000", "#ffffff"))
    render.table(("#000000", "#ffffff"))
    assert render.table.cache_info().hits == 1


def test_the_colour_offset_walks_the_ramp_round():
    from app.services import render

    field = np.array([[3, 6], [9, 12]], dtype=np.int32)
    plain = render.paint(field, 20)
    moved = render.paint(field, 20, shift=0.4)
    assert plain.tolist() != moved.tolist()
    # a whole turn of the ramp comes back to where it started
    assert render.paint(field, 20, shift=1.0).tolist() == plain.tolist()
