"""
Every video's scene follows its script: one `with self.beat("bNN")` block for each beat, in the
script's order, none merged and none empty. While a scene is being written the blocks it has must
be the first beats of the script; tests/test_final_videos.py requires all of them.
The scene files are read as text, so this test needs no Manim.
"""
import ast
import importlib
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
VIDEOS = ("v01_dice", "v02_test", "v03_game", "v04_silence", "v05_taxi", "v06_ruin")


def beat_blocks(path: Path) -> list[tuple[str, ast.With]]:
    """the beat blocks of the scene class named by SCENE, in the order they are written"""
    source = path.read_text(encoding="utf-8")
    named = re.search(r'^SCENE\s*=\s*"(\w+)"', source, re.M)
    assert named, f"{path}: no SCENE = \"...\" line"
    tree = ast.parse(source)
    classes = [n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == named.group(1)]
    assert classes, f"{path}: no class {named.group(1)}"
    out = []
    for node in ast.walk(classes[0]):
        if not isinstance(node, ast.With):
            continue
        for item in node.items:
            call = item.context_expr
            if isinstance(call, ast.Call) and isinstance(call.func, ast.Attribute) and call.func.attr == "beat" and call.args and isinstance(call.args[0], ast.Constant):
                out.append((call.args[0].value, node))
    return sorted(out, key=lambda pair: pair[1].lineno)


def calls_in(block: ast.With) -> set[str]:
    return {n.func.attr for n in ast.walk(block) if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)}


def written() -> list[str]:
    return [v for v in VIDEOS if (ROOT / v / "scene.py").exists()]


@pytest.mark.parametrize("video", written() or ["none"])
def test_scene_follows_script(video):
    if video == "none":
        pytest.skip("no scene is written yet")
    beats = [b.id for b in importlib.import_module(f"{video}.script").BEATS]
    blocks = beat_blocks(ROOT / video / "scene.py")
    ids = [i for i, _ in blocks]
    assert len(ids) == len(set(ids)), f"{video}: a beat is written twice"
    assert ids == beats[: len(ids)], f"{video}: the beats are not the script's, in its order"
    for beat_id, block in blocks:
        calls = calls_in(block)
        assert calls & {"play", "add", "remove", "top"}, f"{video} {beat_id}: the beat changes nothing on the screen"
    source = (ROOT / video / "scene.py").read_text(encoding="utf-8")
    assert not re.search(r"TODO|FIXME|for brevity|placeholder|\bpass\b\s*$", source, re.M | re.I), f"{video}: unfinished code"
    construct = [n for n in ast.walk(ast.parse(source)) if isinstance(n, ast.FunctionDef) and n.name == "construct"]
    assert construct, f"{video}: no construct"
    if ids == beats:
        last = construct[0].body[-1]
        assert isinstance(last, ast.Expr) and isinstance(last.value, ast.Call) and getattr(last.value.func, "attr", "") == "finish", f"{video}: construct does not end with self.finish()"
