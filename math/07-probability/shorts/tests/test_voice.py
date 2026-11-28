import array
import json
import math
import os
import wave

import pytest

import settings
import voice

TONE_RATE = 22050
TONE_HZ = 440
TONE_PEAK = 12000


def tone(path, length: float) -> None:
    count = round(length * TONE_RATE)
    wave_form = array.array("h", (
        round(TONE_PEAK * math.cos(2 * math.pi * TONE_HZ * i / TONE_RATE)) for i in range(count)
    ))
    voice.write_wav(path, wave_form.tobytes(), TONE_RATE)


class Tone:
    name = "tone"
    model = "tone-1"

    def __init__(self, length: float = 0.5):
        self.length = length
        self.calls = 0

    def synth(self, text, lang, out_path):
        self.calls += 1
        tone(out_path, self.length)


@pytest.fixture(autouse=True)
def cache(tmp_path, monkeypatch):
    monkeypatch.setattr(voice, "CACHE", tmp_path / "voice_cache")
    return tmp_path / "voice_cache"


def test_cache_hit():
    source = Tone()
    first = voice.speak("Кубики честные.", "ru", source)
    second = voice.speak("Кубики честные.", "ru", source)
    assert source.calls == 1
    assert first == second
    assert first.seconds == pytest.approx(0.5, abs=0.02)


def test_cache_note(cache):
    source = Tone()
    clip = voice.speak("The dice are fair.", "en", source)
    note = json.loads(clip.path.with_suffix(".json").read_text(encoding="utf-8"))
    assert note == {
        "provider": "tone",
        "model": "tone-1",
        "voice": settings.VOICE,
        "instruction": settings.VOICE_STYLE["en"],
        "lang": "en",
        "text": "The dice are fair.",
        "seconds": clip.seconds,
    }
    assert clip.path.parent == cache
    assert len(clip.path.stem) == 24


def test_key_changes(monkeypatch):
    source = Tone()
    base = voice.key(source, "ru", "Семь.")
    assert voice.key(source, "ru", "Семь.") == base
    assert voice.key(source, "en", "Семь.") != base
    assert voice.key(source, "ru", "Шесть.") != base
    assert voice.key(voice.SilentProvider(), "ru", "Семь.") != base
    monkeypatch.setattr(settings, "VOICE", "cedar")
    assert voice.key(source, "ru", "Семь.") != base


def test_silent_length():
    text = "x" * 28
    clip = voice.speak(text, "ru", voice.SilentProvider())
    assert clip.seconds == pytest.approx(2.25, abs=0.02)
    with wave.open(str(clip.path), "rb") as made:
        assert not any(made.readframes(made.getnframes()))


def test_cache_format():
    clip = voice.speak("Семь.", "ru", Tone())
    with wave.open(str(clip.path), "rb") as made:
        assert made.getnchannels() == 1
        assert made.getframerate() == 48000
        assert made.getsampwidth() == 2


def test_provider_choice(monkeypatch):
    monkeypatch.delenv(settings.KEY_ENV, raising=False)
    monkeypatch.delenv(settings.VOICE_ENV, raising=False)
    assert isinstance(voice.provider(), voice.SilentProvider)
    monkeypatch.setenv(settings.KEY_ENV, "set")
    assert isinstance(voice.provider(), voice.SpeechProvider)
    monkeypatch.setenv(settings.VOICE_ENV, "silent")
    assert isinstance(voice.provider(), voice.SilentProvider)
    monkeypatch.setenv(settings.VOICE_ENV, "loud")
    with pytest.raises(ValueError):
        voice.provider()


@pytest.mark.skipif(not os.getenv(settings.KEY_ENV), reason="no key for the voice service")
def test_real_speech():
    clip = voice.speak("Кубики честные.", "ru", voice.SpeechProvider())
    assert 0.3 <= clip.seconds <= 6
