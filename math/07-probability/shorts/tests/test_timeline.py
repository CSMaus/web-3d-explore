import array
import math
import wave

import pytest

import beats
import settings
import timeline
import voice

LENGTHS = {"Раз.": 1.0, "Два.": 2.0, "Три.": 0.5}
RATE = settings.AUDIO_RATE
PEAK = 12000
HZ = 440


class Tone:
    name = "tone"
    model = "tone-1"

    def synth(self, text, lang, out_path):
        count = round(LENGTHS[text] * RATE)
        form = array.array("h", (round(PEAK * math.cos(2 * math.pi * HZ * i / RATE)) for i in range(count)))
        voice.write_wav(out_path, form.tobytes(), RATE)


@pytest.fixture(autouse=True)
def stage(tmp_path, monkeypatch):
    steps = [beats.Beat(f"b0{i}", ru=text, en=text) for i, text in enumerate(LENGTHS, start=1)]
    monkeypatch.setattr(beats, "load", lambda video: ({"ru": "Проба", "en": "Probe"}, steps))
    monkeypatch.setattr(voice, "CACHE", tmp_path / "voice_cache")
    monkeypatch.setattr(timeline, "OUT", tmp_path / "out")


def test_starts():
    made = timeline.build("probe", "ru", Tone())
    assert [s.start for s in made.slots] == [0.4, 1.75, 4.1]
    assert [s.speech for s in made.slots] == [1.0, 2.0, 0.5]
    assert made.total == 5.75
    assert made["b02"].text == "Два."
    with pytest.raises(KeyError):
        made["b09"]


def test_in_a_row():
    made = timeline.build("probe", "ru", Tone())
    assert made.slots[0].start == settings.LEAD
    for before, after in zip(made.slots, made.slots[1:]):
        assert after.start == before.end
    for slot in made.slots:
        assert slot.end == pytest.approx(slot.start + slot.speech + settings.PAUSE, abs=1e-9)
    assert made.total == pytest.approx(made.slots[-1].end + settings.TAIL, abs=1e-9)


def test_track(tmp_path):
    source = Tone()
    made = timeline.build("probe", "ru", source)
    path = timeline.track(made, tmp_path / "out" / "track.wav", source)
    with wave.open(str(path), "rb") as clip:
        assert (clip.getnchannels(), clip.getframerate(), clip.getsampwidth()) == (1, RATE, 2)
        line = array.array("h", clip.readframes(clip.getnframes()))
    assert abs(len(line) - made.total * RATE) <= 1
    window = RATE // 100
    for slot in made.slots:
        at = round(slot.start * RATE)
        assert any(line[at:at + window])
        quiet = round((slot.start + slot.speech) * RATE) + window
        assert not any(line[quiet:round(slot.end * RATE) - window])
    assert not any(line[:round(settings.LEAD * RATE) - window])


def test_mix_exact():
    source = Tone()
    made = timeline.build("probe", "ru", source)
    line = timeline.mix(made, source)
    assert len(line) == round(made.total * RATE)
    for slot in made.slots:
        at = round(slot.start * RATE)
        assert line[at] != 0
        assert line[at - 1] == 0
        assert line[at + round(slot.speech * RATE)] == 0


def test_save_load():
    made = timeline.build("probe", "ru", Tone())
    timeline.save(made)
    assert timeline.load("probe", "ru") == made
    assert timeline.load_or_build("probe", "ru") == made
