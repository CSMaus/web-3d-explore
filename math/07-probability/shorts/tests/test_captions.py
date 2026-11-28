import re

import pytest

import captions
import settings
from timeline import Slot, Timeline

FIRST = "Два кубика бросили пять тысяч раз. Семёрка выпала чаще всех."
SECOND = "Кубики честные. Откуда у семёрки преимущество?"


def scale() -> Timeline:
    slots = (Slot("b01", FIRST, 0.4, 4.2, 4.95), Slot("b02", SECOND, 4.95, 3.1, 8.4))
    return Timeline("probe", "ru", slots, 9.2)


@pytest.mark.parametrize("colour, want", [
    ("#E8E8EA", "&HEAE8E8&"),
    ("#7C828C", "&H8C827C&"),
    ("#0e1116", "&H16110E&"),
])
def test_colour(colour, want):
    assert captions.ass_colour(colour) == want


@pytest.mark.parametrize("seconds, want", [
    (0, "0:00:00.00"),
    (3.456, "0:00:03.46"),
    (75.5, "0:01:15.50"),
    (3661.07, "1:01:01.07"),
])
def test_stamp(seconds, want):
    assert captions.stamp(seconds) == want


def test_one_per_word():
    made = captions.events(scale())
    assert len(made) == len(FIRST.split()) + len(SECOND.split())
    for event in made:
        assert 0 <= event.lit < len(event.words) <= 4


def test_inside_speech():
    timeline = scale()
    made = captions.events(timeline)
    for before, after in zip(made, made[1:]):
        assert before.end <= after.start + 1e-9
        assert before.start < before.end
    at = 0
    for slot in timeline.slots:
        own = made[at:at + len(slot.text.split())]
        at += len(own)
        assert own[0].start == pytest.approx(slot.start)
        assert own[-1].end == pytest.approx(slot.start + slot.speech)
        assert all(slot.start - 1e-9 <= e.start and e.end <= slot.start + slot.speech + 1e-9 for e in own)
        assert " ".join(e.words[e.lit] for e in own) == slot.text
    assert made[len(FIRST.split())].start - made[len(FIRST.split()) - 1].end == pytest.approx(settings.PAUSE)


def test_long_piece_shrinks():
    short = captions.Event(0, 1, ("Два", "кубика", "бросили"), 0)
    wide = captions.Event(0, 1, ("Число", "называют", "ожидаемым", "выигрышем."), 0)
    assert captions.fitted(short.words) == settings.CAPTION_SIZE_PX
    size = captions.fitted(wide.words)
    assert size < settings.CAPTION_SIZE_PX
    assert len(" ".join(wide.words)) * size * settings.CAPTION_CHAR_W <= settings.CAPTION_MAX_PX
    assert f"{{\\fs{size}}}" in captions.line(wide)
    assert "\\fs" not in captions.line(short)


def test_file(tmp_path):
    timeline = scale()
    path = captions.write(timeline, tmp_path / "say" / "captions.ass")
    text = path.read_text(encoding="utf-8")
    assert "PlayResX: 1080" in text and "PlayResY: 1920" in text
    assert "[Events]" in text
    assert "Style: Say,DejaVu Sans,64,&H008C827C,&H008C827C,&H0016110E,&H0016110E,-1," in text
    rows = [row for row in text.splitlines() if row.startswith("Dialogue:")]
    assert len(rows) == len(captions.events(timeline))
    for row in rows:
        assert "{\\an5\\pos(540,1488)}" in row
        assert len(re.findall(r"\{\\c&HEAE8E8&\}[^{]+\{\\c&H8C827C&\}", row)) == 1
    assert rows[0].startswith("Dialogue: 0,0:00:00.40,")
    assert rows[0].endswith("{\\an5\\pos(540,1488)}{\\c&HEAE8E8&}Два{\\c&H8C827C&} кубика бросили")
