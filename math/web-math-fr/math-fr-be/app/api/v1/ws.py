import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.services.render import BODY, colour, stops, tile, too_much

router = APIRouter()
log = logging.getLogger("mathfr.deep")

# how many sockets are open right now. capacity is billed for the whole time a
# connection is held, so this is the ceiling on what an abandoned tab can cost.
open_count = 0

TOO_BUSY = 1013
IDLE = 1000
FOREIGN = 1008


def allowed(origin: str | None) -> bool:
    if not settings.socket_origins:
        return True
    return origin in settings.socket_origins


def asked(body: dict) -> dict:
    return {
        "nonce": int(body.get("nonce", 0)),
        "width": int(body.get("width", 640)),
        "height": int(body.get("height", 640)),
        "iters": int(body.get("iters", 400)),
        "cx": float(body.get("cx", -0.6)),
        "cy": float(body.get("cy", 0.0)),
        "span": float(body.get("span", 1.6)),
        # the reader picked a palette on the page, and a server render that
        # came back in a different one would read as a different picture.
        "ramp": stops(body.get("ramp")),
        "body": colour(body.get("body"), BODY),
        "shift": max(0.0, min(1.0, float(body.get("shift", 0.0)))),
    }


async def send_levels(socket: WebSocket, body: dict) -> None:
    want = asked(body)
    refused = too_much(want["width"], want["height"], want["iters"])
    if refused:
        await socket.send_json({"kind": "refused", "nonce": want["nonce"], "reason": refused})
        return

    levels = settings.socket.levels
    for step in levels:
        w = max(8, want["width"] // step)
        h = max(8, want["height"] // step)
        png = await asyncio.to_thread(
            tile,
            want["cx"],
            want["cy"],
            want["span"],
            w,
            h,
            want["iters"],
            want["ramp"],
            want["body"],
            want["shift"],
        )
        # the request is echoed back in full. the client can then throw away a
        # tile that belongs to a view it has already moved away from, which a
        # cancellation on this side cannot prevent for a tile already sent.
        await socket.send_json(
            {
                "kind": "tile",
                "nonce": want["nonce"],
                "step": step,
                "width": w,
                "height": h,
                "iters": want["iters"],
                "cx": want["cx"],
                "cy": want["cy"],
                "span": want["span"],
                "png": png,
                "final": step == levels[-1],
            }
        )
        await asyncio.sleep(0)


@router.websocket("/deep")
async def deep(socket: WebSocket) -> None:
    global open_count

    if not allowed(socket.headers.get("origin")):
        await socket.close(code=FOREIGN)
        return
    if open_count >= settings.socket.max_connections:
        await socket.accept()
        await socket.send_json({"kind": "busy", "reason": "too many renders in flight"})
        await socket.close(code=TOO_BUSY)
        return

    await socket.accept()
    open_count += 1
    task: asyncio.Task | None = None
    try:
        while True:
            try:
                body = await asyncio.wait_for(
                    socket.receive_json(), timeout=settings.socket.idle_seconds
                )
            except TimeoutError:
                # a tab left open holds an instance alive for nothing, so a
                # quiet socket is closed rather than waited on. the client
                # reconnects on its next request.
                await socket.close(code=IDLE)
                return
            if task and not task.done():
                task.cancel()
            task = asyncio.create_task(send_levels(socket, body))
    except WebSocketDisconnect:
        pass
    finally:
        if task and not task.done():
            task.cancel()
        open_count -= 1
