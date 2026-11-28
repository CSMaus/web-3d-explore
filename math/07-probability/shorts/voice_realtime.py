import base64
import json
import os
import re
import wave
from dataclasses import dataclass
from typing import Iterable

from openai import OpenAI
from websockets.sync.client import connect

import settings

AUDIO_PART = "response.output_audio.delta"
RESPONSE_END = "response.done"
FAILURE = "error"


class VoiceMismatch(Exception):
    def __init__(self, asked: str, heard: str):
        super().__init__(f"asked: {asked} | heard: {heard}")
        self.asked = asked
        self.heard = heard


def pcm_to_wav(chunks: list[bytes], rate: int, path) -> None:
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(settings.SAMPLE_BYTES)
        out.setframerate(rate)
        out.writeframes(b"".join(chunks))


def bare(text: str) -> str:
    plain = re.sub(r"[^\w\s]|_", " ", text.lower().replace("ё", "е"))
    return " ".join(plain.split())


def same_text(a: str, b: str) -> bool:
    return bare(a) == bare(b)


def requests(text: str, lang: str, model: str) -> list[dict]:
    session = {
        "type": "realtime",
        "model": model,
        "output_modalities": ["audio"],
        "audio": {"output": {
            "format": {"type": "audio/pcm", "rate": settings.REALTIME_RATE},
            "voice": settings.VOICE,
        }},
        "instructions": f"{settings.REALTIME_READ} {settings.VOICE_STYLE[lang]}",
    }
    item = {"type": "message", "role": "user", "content": [{"type": "input_text", "text": text}]}
    return [
        {"type": "session.update", "session": session},
        {"type": "conversation.item.create", "item": item},
        {"type": "response.create", "response": {"output_modalities": ["audio"]}},
    ]


def collect(events: Iterable[dict]) -> list[bytes]:
    chunks = []
    for event in events:
        kind = event.get("type")
        if kind == FAILURE:
            raise RuntimeError(event["error"]["message"])
        if kind == AUDIO_PART:
            chunks.append(base64.b64decode(event["delta"]))
        if kind == RESPONSE_END:
            break
    return chunks


@dataclass(frozen=True)
class RealtimeProvider:
    name: str = "realtime"
    model: str = settings.REALTIME_MODEL

    def read(self, text: str, lang: str) -> list[bytes]:
        headers = {"Authorization": f"Bearer {os.getenv(settings.KEY_ENV)}"}
        with connect(f"{settings.REALTIME_URL}?model={self.model}", additional_headers=headers, max_size=None) as socket:
            for request in requests(text, lang, self.model):
                socket.send(json.dumps(request))
            return collect(json.loads(message) for message in socket)

    def heard(self, path, lang: str) -> str:
        with open(path, "rb") as clip:
            return OpenAI().audio.transcriptions.create(model=settings.CHECK_MODEL, file=clip, language=lang).text

    def synth(self, text: str, lang: str, out_path) -> None:
        heard = ""
        for _ in range(settings.VOICE_TRIES):
            pcm_to_wav(self.read(text, lang), settings.REALTIME_RATE, out_path)
            heard = self.heard(out_path, lang)
            if same_text(text, heard):
                return
        raise VoiceMismatch(text, heard)
