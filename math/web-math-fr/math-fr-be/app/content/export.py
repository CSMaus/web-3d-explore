"""
writes the content the api serves as plain files, so the frontend can run
without the backend for a while. the files mirror the four content routes:

    uv run python -m app.content.export ../math-fr-fe/src/content/snapshot

the backend stays the source; this is run again whenever the content changes.
"""

import json
import sys
from pathlib import Path

from app.content.topics import TOPICS


def main(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    (out / "topics.json").write_text(
        json.dumps([t.card() for t in TOPICS], ensure_ascii=False, indent=1)
    )
    for topic in TOPICS:
        (out / f"{topic.slug}.json").write_text(
            json.dumps(topic.detail(), ensure_ascii=False, indent=1)
        )
        theory = {"systems": topic.systems, "definitions": topic.definitions}
        (out / f"{topic.slug}.equations.json").write_text(
            json.dumps(theory, ensure_ascii=False, indent=1)
        )
    print(f"{1 + 2 * len(TOPICS)} files written to {out}")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
