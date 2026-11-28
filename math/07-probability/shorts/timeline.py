import json
import subprocess
import sys
import wave
from array import array
from dataclasses import asdict, dataclass
from pathlib import Path

import beats
import settings
import voice

OUT = settings.OUT
PLACES = 3


@dataclass(frozen=True)
class Slot:
    id: str
    text: str
    start: float
    speech: float
    end: float


@dataclass(frozen=True)
class Timeline:
    video: str
    lang: str
    slots: tuple[Slot, ...]
    total: float

    def __getitem__(self, id: str) -> Slot:
        for slot in self.slots:
            if slot.id == id:
                return slot
        raise KeyError(id)


def folder(video: str, lang: str) -> Path:
    return OUT / video / lang


def build(video: str, lang: str, provider=None) -> Timeline:
    _, steps = beats.load(video)
    slots = []
    at = settings.LEAD
    for beat in steps:
        text = beat.say(lang)
        speech = round(voice.speak(text, lang, provider).seconds, PLACES)
        end = round(at + speech + beat.pause, PLACES)
        slots.append(Slot(beat.id, text, round(at, PLACES), speech, end))
        at = end
    return Timeline(video, lang, tuple(slots), round(at + settings.TAIL, PLACES))


def save(timeline: Timeline) -> Path:
    path = folder(timeline.video, timeline.lang) / "timeline.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(asdict(timeline), ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def load(video: str, lang: str) -> Timeline:
    raw = json.loads((folder(video, lang) / "timeline.json").read_text(encoding="utf-8"))
    slots = tuple(Slot(**slot) for slot in raw["slots"])
    return Timeline(raw["video"], raw["lang"], slots, raw["total"])


def load_or_build(video: str, lang: str) -> Timeline:
    if (folder(video, lang) / "timeline.json").exists():
        return load(video, lang)
    made = build(video, lang)
    save(made)
    return made


def samples(path) -> array:
    with wave.open(str(path), "rb") as clip:
        data = array("h", clip.readframes(clip.getnframes()))
    if sys.byteorder == "big":
        data.byteswap()
    return data


def mix(timeline: Timeline, provider=None) -> array:
    rate = settings.AUDIO_RATE
    line = array("h", bytes(round(timeline.total * rate) * settings.SAMPLE_BYTES))
    for slot in timeline.slots:
        data = samples(voice.speak(slot.text, timeline.lang, provider).path)
        at = round(slot.start * rate)
        data = data[:len(line) - at]
        line[at:at + len(data)] = data
    return line


def track(timeline: Timeline, path, provider=None) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    line = mix(timeline, provider)
    if sys.byteorder == "big":
        line.byteswap()
    source = provider or voice.provider()
    if source.name == "silent":
        voice.write_wav(path, line.tobytes())
        return path
    raw = path.with_name(f"{path.stem}_raw{path.suffix}")
    voice.write_wav(raw, line.tobytes())
    subprocess.run([
        settings.FFMPEG, "-y", "-v", "error", "-i", str(raw), "-af", settings.LOUDNESS,
        "-ac", "1", "-ar", str(settings.AUDIO_RATE), "-c:a", "pcm_s16le", str(path),
    ], check=True)
    return path
