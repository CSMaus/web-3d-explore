import base64
import json
import os
import re
import wave
from dataclasses import dataclass
from typing import Iterable, Iterator

from websockets.sync.client import connect

import settings

SESSION_SET = "session.update"
REPLY_ASK = "response.create"
AUDIO_PART = "response.output_audio.delta"
TEXT_PART = "response.output_audio_transcript.done"
RESPONSE_END = "response.done"
FAILURE = "error"
DONE = "completed"
NO_CONTEXT = "none"
MARKS = re.compile(r"[^\w\s]|_")
DIGIT = re.compile(r"\d")
NUMBERS = {lang: re.compile(words) for lang, words in settings.NUMBER_WORDS.items()}


class VoiceMismatch(Exception):
    def __init__(self, beat: str, asked: str, heard: str):
        super().__init__(f"{beat} | asked: {asked} | heard: {heard}")
        self.beat = beat
        self.asked = asked
        self.heard = heard


def pcm_to_wav(chunks: list[bytes], rate: int, path) -> None:
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(settings.SAMPLE_BYTES)
        out.setframerate(rate)
        out.writeframes(b"".join(chunks))


def plain(text: str, lang: str) -> str:
    mark = settings.NUMBER_MARK
    kept = []
    for word in MARKS.sub(" ", text.lower().replace(*settings.SAME_LETTERS)).split():
        if DIGIT.search(word) or NUMBERS[lang].fullmatch(word):
            word = mark
        if word != mark or kept[-1:] != [mark]:
            kept.append(word)
    return " ".join(kept)


def same_text(a: str, b: str, lang: str) -> bool:
    return plain(a, lang) == plain(b, lang)


def session_event(lang: str, voice: str) -> dict:
    return {"type": SESSION_SET, "session": {
        "type": "realtime",
        "output_modalities": ["audio"],
        "audio": {
            "input": {"turn_detection": None},
            "output": {
                "format": {"type": settings.REALTIME_FORMAT, "rate": settings.REALTIME_RATE},
                "voice": voice,
            },
        },
        "instructions": settings.READ_STYLE[lang],
    }}


def beat_events(text: str, lang: str) -> list[dict]:
    item = {"type": "message", "role": "user", "content": [{"type": "input_text", "text": text}]}
    return [{"type": REPLY_ASK, "response": {
        "conversation": NO_CONTEXT,
        "input": [item],
        "instructions": settings.READ_STYLE[lang],
        "output_modalities": ["audio"],
    }}]


def trouble(reply: dict) -> str:
    details = reply.get("status_details") or {}
    fault = details.get("error") or {}
    return fault.get("message") or details.get("reason") or str(reply.get("status"))


def collect(events: Iterable[dict]) -> tuple[list[bytes], str]:
    chunks, heard = [], []
    for event in events:
        kind = event.get("type")
        if kind == FAILURE:
            raise RuntimeError(event["error"]["message"])
        if kind == AUDIO_PART:
            chunks.append(base64.b64decode(event["delta"]))
        if kind == TEXT_PART:
            heard.append(event["transcript"])
        if kind == RESPONSE_END:
            reply = event.get("response") or {}
            if reply.get("status") != DONE:
                raise RuntimeError(trouble(reply))
            break
    return chunks, " ".join(heard)


def incoming(socket) -> Iterator[dict]:
    while True:
        yield json.loads(socket.recv(timeout=settings.REALTIME_WAIT))


@dataclass(frozen=True)
class RealtimeProvider:
    name: str = "realtime"
    model: str = settings.REALTIME_MODEL
    voice: str = ""

    def open(self, lang: str):
        headers = {"Authorization": f"Bearer {os.getenv(settings.KEY_ENV)}"}
        socket = connect(f"{settings.REALTIME_URL}?model={self.model}", additional_headers=headers, max_size=None)
        socket.send(json.dumps(session_event(lang, self.voice or settings.VOICE)))
        return socket

    def read(self, socket, text: str, lang: str) -> tuple[list[bytes], str]:
        for event in beat_events(text, lang):
            socket.send(json.dumps(event))
        return collect(incoming(socket))

    def take(self, socket, beat: str, text: str, lang: str, out_path) -> None:
        heard = ""
        for _ in range(settings.VOICE_TRIES):
            chunks, heard = self.read(socket, text, lang)
            if same_text(text, heard, lang):
                pcm_to_wav(chunks, settings.REALTIME_RATE, out_path)
                return
        raise VoiceMismatch(beat, text, heard)

    def synth_mixed(self, lines: list[tuple]) -> None:
        if not lines:
            return
        with self.open(lines[0][2]) as socket:
            for beat, text, lang, out_path in lines:
                self.take(socket, beat, text, lang, out_path)

    def synth_all(self, lines: list[tuple], lang: str) -> None:
        self.synth_mixed([(beat, text, lang, out_path) for beat, text, out_path in lines])

    def synth(self, text: str, lang: str, out_path) -> None:
        self.synth_all([(settings.LONE_BEAT, text, out_path)], lang)
