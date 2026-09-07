import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.api.v1 import ws
from app.core.config import settings


def test_an_unmarked_socket_is_closed(client: TestClient):
    with pytest.raises(WebSocketDisconnect), client.websocket_connect("/api/deep") as socket:
        socket.receive_json()


def test_a_foreign_origin_is_closed(client: TestClient):
    headers = {"origin": "http://somewhere.else"}
    with (
        pytest.raises(WebSocketDisconnect),
        client.websocket_connect("/api/deep", headers=headers) as socket,
    ):
        socket.receive_json()


def test_levels_stream_coarse_to_fine(client: TestClient, origin: dict):
    with client.websocket_connect("/api/deep", headers=origin) as socket:
        socket.send_json({"width": 128, "height": 128, "iters": 120, "span": 1.6})
        steps = []
        while True:
            msg = socket.receive_json()
            assert msg["kind"] == "tile"
            assert len(msg["png"]) > 100
            steps.append(msg["step"])
            if msg["final"]:
                break
        assert steps == [8, 4, 2, 1]


def test_the_request_comes_back_with_every_tile(client: TestClient, origin: dict):
    want = {
        "nonce": 77,
        "width": 96,
        "height": 96,
        "iters": 90,
        "cx": -0.743643887037151,
        "cy": 0.13182590420533,
        "span": 3e-5,
    }
    with client.websocket_connect("/api/deep", headers=origin) as socket:
        socket.send_json(want)
        while True:
            msg = socket.receive_json()
            assert msg["nonce"] == 77
            assert msg["cx"] == want["cx"]
            assert msg["cy"] == want["cy"]
            assert msg["span"] == want["span"]
            assert msg["iters"] == want["iters"]
            if msg["final"]:
                break


def test_an_oversized_render_is_refused(client: TestClient, origin: dict):
    with client.websocket_connect("/api/deep", headers=origin) as socket:
        socket.send_json({"nonce": 5, "width": 4096, "height": 4096, "iters": 100000})
        refusal = socket.receive_json()
        assert refusal["kind"] == "refused"
        assert refusal["nonce"] == 5


def test_the_socket_is_released_when_it_closes(client: TestClient, origin: dict):
    before = ws.open_count
    with client.websocket_connect("/api/deep", headers=origin) as socket:
        socket.send_json({"width": 64, "height": 64, "iters": 60})
        while not socket.receive_json()["final"]:
            pass
    assert ws.open_count == before


def test_a_socket_over_the_cap_is_turned_away(client: TestClient, origin: dict, monkeypatch):
    monkeypatch.setattr(settings.socket, "max_connections", 1)
    with (
        client.websocket_connect("/api/deep", headers=origin),
        pytest.raises(WebSocketDisconnect),
        client.websocket_connect("/api/deep", headers=origin) as second,
    ):
        assert second.receive_json()["kind"] == "busy"
        second.receive_json()


def test_a_quiet_socket_is_closed_rather_than_held(client: TestClient, origin: dict, monkeypatch):
    monkeypatch.setattr(settings.socket, "idle_seconds", 0.15)
    with (
        pytest.raises(WebSocketDisconnect),
        client.websocket_connect("/api/deep", headers=origin) as socket,
    ):
        socket.receive_json()
