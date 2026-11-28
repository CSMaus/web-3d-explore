import os

import pytest

import settings

NAMES = ("SHORT_PROBE_ONE", "SHORT_PROBE_TWO", "SHORT_PROBE_THREE", "SHORT_PROBE_FOUR")


@pytest.fixture
def clean(monkeypatch):
    for name in NAMES:
        monkeypatch.setenv(name, "held")
        monkeypatch.delenv(name)
    return monkeypatch


def write(tmp_path, text):
    path = tmp_path / "probe.env"
    path.write_text(text, encoding="utf-8")
    return str(path)


def test_missing_is_set(clean, tmp_path):
    settings.load_env(write(tmp_path, "SHORT_PROBE_ONE=alpha\n"))
    assert os.environ["SHORT_PROBE_ONE"] == "alpha"


def test_present_is_kept(clean, tmp_path):
    clean.setenv("SHORT_PROBE_ONE", "terminal")
    settings.load_env(write(tmp_path, "SHORT_PROBE_ONE=file\nSHORT_PROBE_TWO=beta\n"))
    assert os.environ["SHORT_PROBE_ONE"] == "terminal"
    assert os.environ["SHORT_PROBE_TWO"] == "beta"


def test_skipped_lines(clean, tmp_path):
    text = "# SHORT_PROBE_ONE=alpha\n\n   \nSHORT_PROBE_TWO=\nSHORT_PROBE_THREE=''\nno equals sign\nSHORT_PROBE_FOUR=delta\n"
    settings.load_env(write(tmp_path, text))
    assert "SHORT_PROBE_ONE" not in os.environ
    assert "SHORT_PROBE_TWO" not in os.environ
    assert "SHORT_PROBE_THREE" not in os.environ
    assert os.environ["SHORT_PROBE_FOUR"] == "delta"


def test_export_and_quotes(clean, tmp_path):
    text = "export SHORT_PROBE_ONE=alpha\nSHORT_PROBE_TWO=\"two words\"\nSHORT_PROBE_THREE = 'a=b'\nSHORT_PROBE_FOUR='open\n"
    settings.load_env(write(tmp_path, text))
    assert os.environ["SHORT_PROBE_ONE"] == "alpha"
    assert os.environ["SHORT_PROBE_TWO"] == "two words"
    assert os.environ["SHORT_PROBE_THREE"] == "a=b"
    assert os.environ["SHORT_PROBE_FOUR"] == "'open"


def test_no_file(clean, tmp_path):
    before = dict(os.environ)
    settings.load_env("")
    settings.load_env(str(tmp_path / "absent.env"))
    assert dict(os.environ) == before
