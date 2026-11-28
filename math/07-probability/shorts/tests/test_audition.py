import subprocess
import sys

import pytest

import audition
import beats
import settings


def test_plan():
    takes = audition.plan()
    assert len(takes) == 12
    assert len({t.path for t in takes}) == 12
    assert {t.voice for t in takes} == {"cedar", "ash", "echo", "ballad", "verse", "marin"}
    assert {t.lang for t in takes} == set(beats.LANGS)
    assert {t.path.name for t in takes} >= {"cedar-ru.wav", "marin-en.wav"}
    _, steps = beats.load("v01_dice")
    lines = {b.say(lang) for b in steps if b.id == "b01" for lang in beats.LANGS}
    assert {t.text for t in takes} == lines


def test_plan_beat():
    _, steps = beats.load("v01_dice")
    takes = audition.plan("v01_dice", steps[1].id)
    assert {t.text for t in takes} == {steps[1].say(lang) for lang in beats.LANGS}
    with pytest.raises(KeyError):
        audition.plan("v01_dice", "b99")


def test_no_key(monkeypatch, capsys):
    monkeypatch.delenv(settings.KEY_ENV, raising=False)
    assert audition.main([]) == 2
    assert capsys.readouterr().out.strip() == f"no {settings.KEY_ENV}: nothing to audition"


def test_no_key_exit(monkeypatch):
    monkeypatch.delenv(settings.KEY_ENV, raising=False)
    done = subprocess.run([sys.executable, "audition.py"], cwd=settings.ROOT, capture_output=True, text=True)
    assert done.returncode == 2
