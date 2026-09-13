from fastapi.testclient import TestClient

from app.content.topics import PLANNED, READY, TOPICS, WRITING


def test_the_index_lists_every_topic_in_reading_order(client: TestClient):
    """chaos sits next to fractals, which it contains, and the two
    neural-network topics sit next to each other."""
    body = client.get("/api/topics").json()
    assert [t["number"] for t in body] == [0, 1, 2, 3, 4, 5]
    assert [t["slug"] for t in body] == [
        "complex",
        "fractals",
        "chaos",
        "networks",
        "tokens",
        "primes",
    ]
    for card in body:
        assert card["title"]
        assert card["summary"]
        assert card["state"] in {READY, WRITING, PLANNED}


def test_only_the_finished_topic_says_it_is_ready(client: TestClient):
    body = client.get("/api/topics").json()
    by_state = {t["slug"]: t["state"] for t in body}
    assert by_state == {
        "fractals": READY,
        "chaos": WRITING,
        "networks": WRITING,
        "tokens": WRITING,
        "primes": WRITING,
        "complex": WRITING,
    }


def test_a_topic_being_written_has_its_mathematics_and_no_clips(client: TestClient):
    """the play pages and the equations come first; the clips are made after."""
    card = next(t for t in client.get("/api/topics").json() if t["slug"] == "chaos")
    assert card["systems"] == 8
    assert card["parts"] == 0
    assert card["beats"] == 0
    body = client.get("/api/topics/chaos/equations").json()
    assert len(body["systems"]) == 8
    assert len(body["definitions"]) == 6
    assert [s["id"] for s in body["systems"]] == [
        "field",
        "solvers",
        "phase",
        "lorenz",
        "rossler",
        "logistic",
        "bifurcation",
        "control",
    ]


def test_a_topic_with_networks_in_it_carries_its_mathematics(client: TestClient):
    card = next(t for t in client.get("/api/topics").json() if t["slug"] == "networks")
    assert card["systems"] == 13
    assert card["parts"] == 0
    body = client.get("/api/topics/networks/equations").json()
    assert len(body["definitions"]) == 5
    assert [s["id"] for s in body["systems"]] == [
        "rate",
        "rate2",
        "accumulate",
        "growth",
        "slope",
        "line",
        "unit",
        "layers",
        "learn",
        "blame",
        "pictures",
        "sequence",
        "words",
    ]
    # every system carries its blocks and every block a formula
    for system in body["systems"]:
        assert system["blocks"], system["id"]
        for block in system["blocks"]:
            assert block["tex"] and block["label"] and block["note"], system["id"]
    # the rejected pages are gone from the backend as well
    assert client.get("/api/topics/networks/equations/perceptron").status_code == 404
    # a system asked for under the wrong topic is not found
    assert client.get("/api/topics/chaos/equations/blame").status_code == 404
    assert client.get("/api/topics/networks/equations/lorenz").status_code == 404


def test_a_planned_topic_carries_nothing_but_its_summary(client: TestClient):
    # every topic is at least being written now, so the rule is checked on whatever
    # the registry reports as planned, which may be nothing
    for card in client.get("/api/topics").json():
        if card["state"] != PLANNED:
            continue
        assert card["parts"] == 0
        assert card["beats"] == 0
        assert card["systems"] == 0
        assert card["summary"]


def test_the_opening_topic_is_number_zero_and_carries_seven_systems(client: TestClient):
    card = client.get("/api/topics").json()[0]
    assert card["slug"] == "complex"
    assert card["number"] == 0
    body = client.get("/api/topics/complex/equations").json()
    assert [s["id"] for s in body["systems"]] == [
        "line",
        "turn",
        "add",
        "multiply",
        "square",
        "round",
        "quaternions",
    ]
    assert len(body["definitions"]) == 3


def test_the_primes_aside_is_marked_as_one(client: TestClient):
    cards = client.get("/api/topics").json()
    assert [c["slug"] for c in cards if c["aside"]] == ["primes"]
    body = client.get("/api/topics/primes/equations").json()
    assert [s["id"] for s in body["systems"]] == ["gaps"]
    assert len(body["definitions"]) == 2


def test_the_tokens_topic_carries_its_fourteen_systems(client: TestClient):
    card = next(t for t in client.get("/api/topics").json() if t["slug"] == "tokens")
    assert card["systems"] == 14
    assert card["parts"] == 0
    body = client.get("/api/topics/tokens/equations").json()
    assert len(body["definitions"]) == 5
    assert [s["id"] for s in body["systems"]] == [
        "bytes",
        "merge",
        "segment",
        "cost",
        "table",
        "meaning",
        "space",
        "order",
        "attend",
        "predict",
        "generate",
        "sample",
        "pool",
        "artefacts",
    ]
    for system in body["systems"]:
        assert system["blocks"], system["id"]
        for block in system["blocks"]:
            assert block["tex"] and block["label"] and block["note"], system["id"]
    assert client.get("/api/topics/networks/equations/attend").status_code == 404


def test_the_fractals_topic_carries_the_whole_series(client: TestClient):
    body = client.get("/api/topics/fractals").json()
    assert body["beats"] == 53
    assert len(body["part_list"]) == 10
    assert body["seconds"] > 1000
    assert body["part_list"][0]["beats"][0]["slug"] == "02-coastline"


def test_every_part_has_one_clip_and_a_short_caption(client: TestClient):
    body = client.get("/api/topics/fractals").json()
    for part in body["part_list"]:
        assert "video" in part
        words = len(part["caption"].split())
        # a stand-in for the voice-over, not an essay
        assert 20 <= words <= 60, (part["number"], words)


def test_every_beat_has_words(client: TestClient):
    body = client.get("/api/topics/fractals").json()
    for part in body["part_list"]:
        for beat in part["beats"]:
            assert beat["shows"]
            assert beat["say"]
            assert beat["seconds"] > 0


def test_a_topic_with_no_clips_answers_rather_than_failing(client: TestClient):
    body = client.get("/api/topics/tokens").json()
    assert body["state"] == WRITING
    assert body["part_list"] == []
    assert body["title"]


def test_an_unknown_topic_is_a_404(client: TestClient):
    assert client.get("/api/topics/nonsense").status_code == 404
    assert client.get("/api/topics/nonsense/equations").status_code == 404


def test_equations_belong_to_their_topic(client: TestClient):
    body = client.get("/api/topics/fractals/equations").json()
    assert len(body["systems"]) == 10
    assert len(body["definitions"]) == 4
    ids = [s["id"] for s in body["systems"]]
    assert ids == [
        "ifs",
        "lsystem",
        "lichtenberg",
        "dla",
        "julia",
        "mandelbrot",
        "mandelbulb",
        "hurst",
        "credibility",
        "tails",
    ]


def test_one_system_by_name(client: TestClient):
    body = client.get("/api/topics/fractals/equations/julia").json()
    assert body["name"]
    assert body["blocks"]
    assert body["dimension"]["tex"]


def test_a_system_asked_for_under_the_wrong_topic_is_not_found(client: TestClient):
    assert client.get("/api/topics/chaos/equations/julia").status_code == 404
    assert client.get("/api/topics/fractals/equations/lorenz").status_code == 404
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
