import pytest

import beats
import chunks

BANNED = ("(", ")", chr(0x2014), chr(0x2013))
CASES = [(video, lang) for video in beats.VIDEOS for lang in beats.LANGS]


@pytest.mark.parametrize("video, lang", CASES)
def test_shape(video, lang):
    title, steps = beats.load(video)
    assert title[lang].strip()
    assert set(title) == set(beats.LANGS)
    assert 17 <= len(steps) <= 19
    assert [b.id for b in steps] == [f"b{i:02d}" for i in range(1, len(steps) + 1)]


@pytest.mark.parametrize("video, lang", CASES)
def test_sentences(video, lang):
    _, steps = beats.load(video)
    for beat in steps:
        parts = chunks.sentences(beat.say(lang))
        sizes = [len(p.split()) for p in parts]
        assert max(sizes) <= 8, f"{video} {beat.id} {lang}"
        assert len(parts) <= 2 or set(sizes) == {1}, f"{video} {beat.id} {lang}"


@pytest.mark.parametrize("video, lang", CASES)
def test_signs(video, lang):
    title, steps = beats.load(video)
    for text in [title[lang]] + [b.say(lang) for b in steps]:
        assert not any(sign in text for sign in BANNED), text


@pytest.mark.parametrize("video, lang", CASES)
def test_word_total(video, lang):
    _, steps = beats.load(video)
    total = sum(len(b.say(lang).split()) for b in steps)
    assert 85 <= total <= 160, total


@pytest.mark.parametrize("video, lang", CASES)
def test_chunks(video, lang):
    _, steps = beats.load(video)
    for beat in steps:
        text = beat.say(lang)
        parts = chunks.chunks(text, lang)
        assert all(1 <= len(p.split()) <= 4 for p in parts), f"{video} {beat.id} {lang}"
        assert " ".join(parts) == text


def test_say_unknown():
    _, steps = beats.load(beats.VIDEOS[0])
    with pytest.raises(KeyError):
        steps[0].say("fr")
