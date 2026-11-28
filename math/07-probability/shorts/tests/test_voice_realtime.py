import base64
import wave

import pytest

import settings
import voice
import voice_realtime


def test_pcm_length(tmp_path):
    chunks = [bytes(2 * 6000), bytes(2 * 9000), bytes(2 * 3000)]
    path = tmp_path / "clip.wav"
    voice_realtime.pcm_to_wav(chunks, 24000, path)
    with wave.open(str(path), "rb") as made:
        assert made.getnframes() == 18000
        assert made.getnframes() / made.getframerate() == pytest.approx(18000 / 24000)
        assert (made.getnchannels(), made.getsampwidth()) == (1, 2)


@pytest.mark.parametrize("a, b, same", [
    ("Кубики честные. Откуда у семёрки преимущество?", "Кубики честные, откуда у семёрки преимущество", True),
    ("Семёрка выпала чаще всех.", "Семерка выпала чаще всех.", True),
    ("The Dice Are Fair.", "the dice are  fair", True),
    ("Сумма два. Одна клетка.", "Сумма два. Только одна клетка.", False),
    ("Сумма два. Одна клетка.", "Сумма два. Клетка.", False),
])
def test_same_text(a, b, same):
    assert voice_realtime.same_text(a, b) is same


def test_requests():
    session, item, reply = voice_realtime.requests("Семь.", "ru", settings.REALTIME_MODEL)
    assert [session["type"], item["type"], reply["type"]] == ["session.update", "conversation.item.create", "response.create"]
    assert session["session"]["output_modalities"] == ["audio"]
    assert session["session"]["audio"]["output"]["voice"] == settings.VOICE
    assert session["session"]["instructions"].startswith(settings.REALTIME_READ)
    assert session["session"]["instructions"].endswith(settings.VOICE_STYLE["ru"])
    assert item["item"]["content"] == [{"type": "input_text", "text": "Семь."}]


def test_collect_stops():
    part = base64.b64encode(b"\x01\x00").decode()
    events = [
        {"type": "session.updated"},
        {"type": "response.output_audio.delta", "delta": part},
        {"type": "response.output_audio.delta", "delta": part},
        {"type": "response.done"},
        {"type": "response.output_audio.delta", "delta": part},
    ]
    assert voice_realtime.collect(events) == [b"\x01\x00", b"\x01\x00"]


def test_collect_fails():
    with pytest.raises(RuntimeError, match="no such voice"):
        voice_realtime.collect([{"type": "error", "error": {"message": "no such voice"}}])


def test_retries(monkeypatch, tmp_path):
    heard = iter(["Шесть.", "Шесть.", "Шесть."])
    source = voice_realtime.RealtimeProvider()
    monkeypatch.setattr(voice_realtime.RealtimeProvider, "read", lambda self, text, lang: [bytes(4800)])
    monkeypatch.setattr(voice_realtime.RealtimeProvider, "heard", lambda self, path, lang: next(heard))
    with pytest.raises(voice_realtime.VoiceMismatch) as failure:
        source.synth("Семь.", "ru", tmp_path / "clip.wav")
    assert (failure.value.asked, failure.value.heard) == ("Семь.", "Шесть.")
    assert next(heard, None) is None


def test_provider_choice(monkeypatch):
    monkeypatch.setenv(settings.VOICE_ENV, "realtime")
    assert isinstance(voice.provider(), voice_realtime.RealtimeProvider)
