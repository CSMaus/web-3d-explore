import pytest

import assemble
import settings
import sheet
import timeline


def command(pitch: float, rubber: bool = False) -> list[str]:
    return assemble.ffmpeg_command(
        "out/media/videos/scene/960p15/v00_smoke_ru.mp4",
        "out/v00_smoke/ru/track.wav",
        "out/v00_smoke/ru/captions.ass",
        "out/v00_smoke_ru.mp4",
        9.123,
        pitch,
        rubber,
    )


def after(cmd: list[str], flag: str) -> list[str]:
    return [cmd[i + 1] for i, part in enumerate(cmd) if part == flag]


def test_plain_command():
    cmd = command(1.0)
    assert after(cmd, "-i") == ["out/media/videos/scene/960p15/v00_smoke_ru.mp4", "out/v00_smoke/ru/track.wav"]
    assert after(cmd, "-vf") == ["ass=out/v00_smoke/ru/captions.ass"]
    assert after(cmd, "-t") == ["9.123"]
    assert cmd[-1] == "out/v00_smoke_ru.mp4"
    assert "-af" not in cmd
    assert after(cmd, "-c:v") == ["libx264"] and after(cmd, "-crf") == ["18"]
    assert after(cmd, "-pix_fmt") == ["yuv420p"]
    assert after(cmd, "-c:a") == ["aac"] and after(cmd, "-b:a") == ["192k"]


def test_pitch_command():
    assert after(command(0.94, rubber=True), "-af") == ["rubberband=pitch=0.94"]
    [plain] = after(command(0.94), "-af")
    assert plain == "asetrate=45120,aresample=48000,atempo=1.063830"


def test_scene_name():
    assert assemble.scene_name("v00_smoke") == "Smoke"


def test_scene_unnamed(tmp_path, monkeypatch):
    (tmp_path / "v99").mkdir()
    (tmp_path / "v99" / "scene.py").write_text("NAME = 1\n", encoding="utf-8")
    monkeypatch.setattr(assemble, "ROOT", tmp_path)
    with pytest.raises(ValueError):
        assemble.scene_name("v99")


def test_describe(monkeypatch):
    monkeypatch.setenv(settings.VOICE_ENV, "silent")
    assert assemble.describe("v01_dice", "en") == "Why seven comes up most\nTwo dice, thrown five thousand times.\n"
    monkeypatch.setenv(settings.VOICE_ENV, "speech")
    assert assemble.describe("v01_dice", "ru").splitlines()[-1] == "Голос синтезирован (OpenAI)."


def test_sheet_moments():
    slots = (timeline.Slot("b01", "Раз.", 0.4, 1.0, 2.4), timeline.Slot("b02", "Два.", 2.4, 1.0, 4.4))
    made = timeline.Timeline("probe", "ru", slots, 5.2)
    assert sheet.moments(made) == [("b01", pytest.approx(2.1)), ("b02", pytest.approx(4.1))]
