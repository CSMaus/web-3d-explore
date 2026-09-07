from fastapi.testclient import TestClient

from app.content.topics import PLANNED, READY, TOPICS


def test_the_index_lists_every_topic_in_reading_order(client: TestClient):
    """chaos sits next to fractals, which it contains, and the two
    neural-network topics sit next to each other."""
    body = client.get("/api/topics").json()
    assert [t["number"] for t in body] == [1, 2, 3, 4]
    assert [t["slug"] for t in body] == ["fractals", "chaos", "networks", "tokens"]
    for card in body:
        assert card["title"]
        assert card["summary"]
        assert card["state"] in {READY, PLANNED, "writing"}


def test_only_the_built_topic_says_it_is_ready(client: TestClient):
    body = client.get("/api/topics").json()
    ready = [t for t in body if t["state"] == READY]
    assert [t["slug"] for t in ready] == ["fractals"]
    for card in body:
        if card["state"] != READY:
            assert card["parts"] == 0
            assert card["beats"] == 0
            assert card["systems"] == 0


def test_the_fractals_topic_carries_the_whole_series(client: TestClient):
    body = client.get("/api/topics/fractals").json()
    assert body["beats"] == 53
    assert len(body["part_list"]) == 10
    assert body["seconds"] > 1000
    assert body["part_list"][0]["beats"][0]["slug"] == "02-coastline"


def test_every_beat_has_words(client: TestClient):
    body = client.get("/api/topics/fractals").json()
    for part in body["part_list"]:
        for beat in part["beats"]:
            assert beat["shows"]
            assert beat["say"]
            assert beat["seconds"] > 0


def test_a_topic_with_nothing_in_it_answers_rather_than_failing(client: TestClient):
    body = client.get("/api/topics/chaos").json()
    assert body["state"] == PLANNED
    assert body["part_list"] == []
    assert body["title"]


def test_an_unknown_topic_is_a_404(client: TestClient):
    assert client.get("/api/topics/nonsense").status_code == 404
    assert client.get("/api/topics/nonsense/equations").status_code == 404


def test_equations_belong_to_their_topic(client: TestClient):
    body = client.get("/api/topics/fractals/equations").json()
    assert len(body["systems"]) == 7
    assert len(body["definitions"]) == 4
    ids = [s["id"] for s in body["systems"]]
    assert ids == ["ifs", "lsystem", "lichtenberg", "dla", "julia", "mandelbrot", "mandelbulb"]


def test_one_system_by_name(client: TestClient):
    body = client.get("/api/topics/fractals/equations/julia").json()
    assert body["name"]
    assert body["blocks"]
    assert body["dimension"]["tex"]


def test_a_system_asked_for_under_the_wrong_topic_is_not_found(client: TestClient):
    assert client.get("/api/topics/chaos/equations/julia").status_code == 404
    assert client.get("/api/topics/fractals/equations/nonsense").status_code == 404


def test_the_flat_paths_are_gone(client: TestClient):
    for path in ("/api/topic", "/api/lecture", "/api/equations"):
        assert client.get(path).status_code == 404


def test_the_counts_on_a_card_match_its_content():
    fractals = next(t for t in TOPICS if t.slug == "fractals")
    card = fractals.card()
    assert card["parts"] == len(fractals.parts)
    assert card["beats"] == sum(len(p["beats"]) for p in fractals.parts)
    assert card["systems"] == len(fractals.systems)
