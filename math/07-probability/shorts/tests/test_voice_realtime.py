import base64
import contextlib
import os
import wave

import pytest

import settings
import voice
import voice_realtime

PART = base64.b64encode(b"\x01\x00").decode()


def test_pcm_length(tmp_path):
    chunks = [bytes(2 * 6000), bytes(2 * 9000), bytes(2 * 3000)]
    path = tmp_path / "clip.wav"
    voice_realtime.pcm_to_wav(chunks, 24000, path)
    with wave.open(str(path), "rb") as made:
        assert made.getnframes() == 18000
        assert made.getnframes() / made.getframerate() == pytest.approx(18000 / 24000)
        assert (made.getnchannels(), made.getsampwidth()) == (1, 2)


@pytest.mark.parametrize("a, b, lang, same", [
    ("Кубики честные. Откуда у семёрки преимущество?", "Кубики честные, откуда у семёрки преимущество", "ru", True),
    ("Семёрка выпала чаще всех.", "Семерка выпала чаще всех.", "ru", True),
    ("The Dice Are Fair.", "the dice are  fair", "en", True),
    ("Бросим пять тысяч раз.", "Бросим 5000 раз.", "ru", True),
    ("Бросим пять тысяч раз.", "Бросим 5 000 раз.", "ru", True),
    ("После пяти тысяч бросков.", "После 5000 бросков.", "ru", True),
    ("Сто двадцать пять из двадцати тысяч.", "125 из 20 000.", "ru", True),
    ("Roll five thousand times.", "Roll 5,000 times.", "en", True),
    ("Twenty-five of three hundred.", "25 of 300.", "en", True),
    ("Кубики честные. Клетка пуста.", "Кубики честные. Только клетка пуста.", "ru", False),
    ("Кубики честные. Клетка пуста.", "Кубики честные. Клетка.", "ru", False),
    ("The dice are fair.", "The dice are very fair.", "en", False),
    ("The dice are fair.", "The dice fair.", "en", False),
    ("Стол стоит у стены.", "Сто стоит у стены.", "ru", False),
])
def test_same_text(a, b, lang, same):
    assert voice_realtime.same_text(a, b, lang) is same


def test_plain():
    assert voice_realtime.plain("Сумма семь: 6 клеток из 36!", "ru") == "сумма 0 клеток из 0"
    assert voice_realtime.plain("One hundred and five, twenty-five.", "en") == "0 and 0"


def test_session_event():
    event = voice_realtime.session_event("ru", "ash")
    session = event["session"]
    assert (event["type"], session["type"]) == ("session.update", "realtime")
    assert "model" not in session
    assert session["output_modalities"] == ["audio"]
    assert session["audio"]["input"] == {"turn_detection": None}
    assert session["audio"]["output"] == {"format": {"type": "audio/pcm", "rate": 24000}, "voice": "ash"}
    assert session["instructions"] == settings.READ_STYLE["ru"]


def test_beat_events():
    events = voice_realtime.beat_events("Семь.", "ru")
    assert [e["type"] for e in events] == ["response.create"]
    reply = events[0]["response"]
    assert reply["conversation"] == "none"
    assert reply["output_modalities"] == ["audio"]
    assert reply["instructions"] == settings.READ_STYLE["ru"]
    assert reply["input"] == [{"type": "message", "role": "user", "content": [{"type": "input_text", "text": "Семь."}]}]
    assert voice_realtime.beat_events("Seven.", "en")[0]["response"]["instructions"] == settings.READ_STYLE["en"]


def test_collect_stops():
    events = [
        {"type": "session.updated"},
        {"type": "response.output_audio.delta", "delta": PART},
        {"type": "response.output_audio.delta", "delta": PART},
        {"type": "response.output_audio_transcript.done", "transcript": "Семь."},
        {"type": "response.done", "response": {"status": "completed"}},
        {"type": "response.output_audio.delta", "delta": PART},
        {"type": "response.output_audio_transcript.done", "transcript": "Шесть."},
    ]
    assert voice_realtime.collect(events) == ([b"\x01\x00", b"\x01\x00"], "Семь.")


def test_collect_fails():
    with pytest.raises(RuntimeError, match="no such voice"):
        voice_realtime.collect([{"type": "error", "error": {"message": "no such voice"}}])


def test_collect_failed():
    details = {"type": "failed", "error": {"code": "server_error", "message": "the model is busy"}}
    with pytest.raises(RuntimeError, match="the model is busy"):
        voice_realtime.collect([{"type": "response.done", "response": {"status": "failed", "status_details": details}}])
    cut = {"type": "incomplete", "reason": "content_filter"}
    with pytest.raises(RuntimeError, match="content_filter"):
        voice_realtime.collect([{"type": "response.done", "response": {"status": "incomplete", "status_details": cut}}])


def wire(monkeypatch, heard: list[str]) -> list[str]:
    opened = []
    replies = iter(heard)

    def opening(self, lang):
        opened.append(lang)
        return contextlib.nullcontext()

    monkeypatch.setattr(voice_realtime.RealtimeProvider, "open", opening)
    monkeypatch.setattr(voice_realtime.RealtimeProvider, "read", lambda self, socket, text, lang: ([bytes(4800)], next(replies)))
    return opened


def test_retries_fail(monkeypatch, tmp_path):
    heard = ["Кубики нечестные.", "Кубики.", "Конечно, кубики честные."]
    opened = wire(monkeypatch, heard + ["Кубики честные."])
    with pytest.raises(voice_realtime.VoiceMismatch) as failure:
        voice_realtime.RealtimeProvider().synth_all([("b07", "Кубики честные.", tmp_path / "clip.wav")], "ru")
    assert (failure.value.beat, failure.value.asked, failure.value.heard) == ("b07", "Кубики честные.", heard[-1])
    for part in ("b07", "Кубики честные.", heard[-1]):
        assert part in str(failure.value)
    assert opened == ["ru"]
    assert not (tmp_path / "clip.wav").exists()


def test_retries_pass(monkeypatch, tmp_path):
    opened = wire(monkeypatch, ["Кубики нечестные.", "кубики честные", "Клетка пуста."])
    lines = [("b07", "Кубики честные.", tmp_path / "a.wav"), ("b08", "Клетка пуста.", tmp_path / "b.wav")]
    voice_realtime.RealtimeProvider().synth_all(lines, "ru")
    assert opened == ["ru"]
    for _, _, path in lines:
        with wave.open(str(path), "rb") as made:
            assert (made.getframerate(), made.getnframes()) == (24000, 2400)


def test_synth_single(monkeypatch, tmp_path):
    opened = wire(monkeypatch, ["Семь."])
    voice_realtime.RealtimeProvider().synth("Семь.", "ru", tmp_path / "clip.wav")
    assert opened == ["ru"]
    assert (tmp_path / "clip.wav").exists()


def test_provider_choice(monkeypatch):
    monkeypatch.setenv(settings.VOICE_ENV, "realtime")
    assert isinstance(voice.provider(), voice_realtime.RealtimeProvider)


@pytest.mark.skipif(not os.getenv(settings.KEY_ENV), reason="no key for the voice service")
def test_real_voice(tmp_path):
    path = tmp_path / "clip.wav"
    voice_realtime.RealtimeProvider().synth("Кубики честные.", "ru", path)
    with wave.open(str(path), "rb") as made:
        assert (made.getnchannels(), made.getframerate()) == (1, 24000)
        assert 0.3 <= made.getnframes() / made.getframerate() <= 8
