import subprocess
import sys

import audition
import beats
import settings


def test_plan():
    takes = audition.plan()
    assert len(takes) == 48
    assert len({t.path for t in takes}) == 48
    assert {t.voice for t in takes} == {"onyx", "cedar", "ash", "echo"}
    assert {t.style for t in takes} == {"calm", "story"}
    assert {t.lang for t in takes} == set(beats.LANGS)
    _, steps = beats.load("v01_dice")
    lines = {b.say(lang) for b in steps if b.id in ("b02", "b06", "b14") for lang in beats.LANGS}
    assert {t.text for t in takes} == lines


def test_index():
    takes = audition.plan()
    rows = audition.index(takes).splitlines()
    assert len(rows) == 50
    assert takes[0].path.name in rows[2]


def test_no_key(monkeypatch, capsys):
    monkeypatch.delenv(settings.KEY_ENV, raising=False)
    assert audition.main() == 2
    assert capsys.readouterr().out.strip() == f"no {settings.KEY_ENV}: nothing to audition"


def test_no_key_exit(monkeypatch):
    monkeypatch.delenv(settings.KEY_ENV, raising=False)
    done = subprocess.run([sys.executable, "audition.py"], cwd=settings.ROOT, capture_output=True, text=True)
    assert done.returncode == 2
