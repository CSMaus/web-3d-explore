import argparse
import hashlib
import json
import os
import subprocess
import wave
from dataclasses import dataclass
from pathlib import Path

from openai import OpenAI

import beats
import settings
import voice_realtime

CACHE = settings.CACHE


@dataclass(frozen=True)
class Clip:
    path: Path
    seconds: float


def write_wav(path, data: bytes, rate: int = settings.AUDIO_RATE) -> None:
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(settings.SAMPLE_BYTES)
        out.setframerate(rate)
        out.writeframes(data)


@dataclass(frozen=True)
class SilentProvider:
    name: str = "silent"
    model: str = ""

    def synth(self, text: str, lang: str, out_path) -> None:
        length = settings.SILENT_LEAD + len(text) / settings.SILENT_CHARS_PER_SECOND
        write_wav(out_path, bytes(round(length * settings.AUDIO_RATE) * settings.SAMPLE_BYTES))


@dataclass(frozen=True)
class SpeechProvider:
    name: str = "speech"
    model: str = settings.VOICE_MODEL
    voice: str = ""
    style: dict | None = None

    def synth(self, text: str, lang: str, out_path) -> None:
        reply = OpenAI().audio.speech.create(
            model=self.model,
            voice=self.voice or settings.VOICE,
            input=text,
            instructions=(self.style or settings.VOICE_STYLE)[lang],
            response_format="wav",
        )
        Path(out_path).write_bytes(reply.read())


MAKERS = {
    "silent": SilentProvider,
    "speech": SpeechProvider,
    "realtime": voice_realtime.RealtimeProvider,
}


def mode() -> str:
    asked = os.getenv(settings.VOICE_ENV, settings.VOICE_DEFAULT)
    if asked == settings.VOICE_DEFAULT:
        return "speech" if os.getenv(settings.KEY_ENV) else "silent"
    if asked not in MAKERS:
        raise ValueError(f"{settings.VOICE_ENV}={asked}")
    return asked


def provider():
    return MAKERS[mode()]()


def fields(source, lang: str, text: str) -> dict:
    return {
        "provider": source.name,
        "model": source.model,
        "voice": settings.VOICE,
        "instruction": settings.VOICE_STYLE[lang],
        "lang": lang,
        "text": text,
    }


def key(source, lang: str, text: str) -> str:
    packed = json.dumps(list(fields(source, lang, text).values()), ensure_ascii=False)
    return hashlib.sha256(packed.encode("utf-8")).hexdigest()[:settings.KEY_SIZE]


def seconds(path) -> float:
    with wave.open(str(path), "rb") as clip:
        return clip.getnframes() / clip.getframerate()


def tidy(raw, out, trim: bool) -> None:
    cmd = [settings.FFMPEG, "-y", "-v", "error", "-i", str(raw)]
    if trim:
        cut = f"silenceremove=start_periods=1:start_threshold={settings.TRIM_DB}dB"
        cmd += ["-af", f"{cut},areverse,{cut},areverse"]
    cmd += ["-ac", "1", "-ar", str(settings.AUDIO_RATE), "-c:a", "pcm_s16le", str(out)]
    subprocess.run(cmd, check=True)


def speak(text: str, lang: str, provider=None) -> Clip:
    source = provider or MAKERS[mode()]()
    name = key(source, lang, text)
    path = CACHE / f"{name}.wav"
    if not path.exists():
        raw = CACHE / "raw" / f"{name}.wav"
        raw.parent.mkdir(parents=True, exist_ok=True)
        source.synth(text, lang, raw)
        tidy(raw, path, source.name != "silent")
        note = fields(source, lang, text) | {"seconds": seconds(path)}
        path.with_suffix(".json").write_text(json.dumps(note, ensure_ascii=False, indent=2), encoding="utf-8")
    return Clip(path, seconds(path))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--v", required=True)
    parser.add_argument("--l", default=beats.LANGS[0], choices=beats.LANGS)
    args = parser.parse_args()
    _, steps = beats.load(args.v)
    total = 0.0
    for beat in steps:
        text = beat.say(args.l)
        clip = speak(text, args.l)
        total += clip.seconds
        print(f"{beat.id}  {clip.seconds:6.2f}  {text}")
    print(f"sum  {total:6.2f}")


if __name__ == "__main__":
    main()
