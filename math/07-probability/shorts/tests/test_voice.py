import array
import json
import math
import os
import wave

import pytest

import settings
import voice
import voice_realtime

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


class Batch:
    name = "batch"
    model = "batch-1"

    def __init__(self):
        self.asked = []

    def synth_all(self, lines, lang):
        self.asked.append([beat for beat, _, _ in lines])
        for _, _, out_path in lines:
            tone(out_path, 0.5)


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
    monkeypatch.setattr(settings, "VOICE", "ballad")
    assert voice.key(source, "ru", "Семь.") != base


def test_key_voice(monkeypatch):
    plain = voice.key(voice_realtime.RealtimeProvider(), "ru", "Семь.")
    assert voice.key(voice_realtime.RealtimeProvider(voice=settings.VOICE), "ru", "Семь.") == plain
    assert voice.key(voice_realtime.RealtimeProvider(voice="verse"), "ru", "Семь.") != plain
    assert voice.fields(voice_realtime.RealtimeProvider(), "ru", "Семь.")["instruction"] == settings.READ_STYLE["ru"]
    spoken = voice.key(voice.SpeechProvider(), "ru", "Семь.")
    assert voice.fields(voice.SpeechProvider(), "ru", "Семь.")["voice"] == "onyx"
    monkeypatch.setattr(settings, "VOICE", "ballad")
    assert voice.key(voice_realtime.RealtimeProvider(), "ru", "Семь.") != plain
    assert voice.key(voice.SpeechProvider(), "ru", "Семь.") == spoken


def test_all_once():
    source = Batch()
    lines = [("b01", "Раз."), ("b02", "Два."), ("b03", "Раз.")]
    voice.speak("Два.", "ru", source)
    assert source.asked == [[settings.LONE_BEAT]]
    clips = voice.speak_all(lines, "ru", source)
    assert source.asked == [[settings.LONE_BEAT], ["b01"]]
    assert voice.speak_all(lines, "ru", source) == clips
    assert len(source.asked) == 2
    assert clips[0] == clips[2] != clips[1]
    assert clips[0] == voice.speak("Раз.", "ru", source)
    assert clips[0].path.with_suffix(".json").exists()


def test_all_whole():
    source = Batch()
    clips = voice.speak_all([("b01", "Раз."), ("b02", "Два."), ("b03", "Три.")], "ru", source)
    assert source.asked == [["b01", "b02", "b03"]]
    assert len({clip.path for clip in clips}) == 3


def test_all_single():
    source = Tone()
    lines = [("b01", "Раз."), ("b02", "Два."), ("b03", "Три.")]
    clips = voice.speak_all(lines, "ru", source)
    assert source.calls == 3
    assert voice.speak_all(lines, "ru", source) == clips
    assert source.calls == 3
    assert [clip.seconds for clip in clips] == pytest.approx([0.5] * 3, abs=0.02)


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
    assert isinstance(voice.provider(), voice_realtime.RealtimeProvider)
    monkeypatch.setenv(settings.VOICE_ENV, "speech")
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
