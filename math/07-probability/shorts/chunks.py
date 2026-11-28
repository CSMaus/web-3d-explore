"""
A spoken line cut into the short pieces the captions show, two to four words at a time.

The rule, in order: a line is cut at its sentence ends; a sentence of up to four words is one
piece; a longer one is cut into threes; a last piece of one word takes a word from the piece
before it; and a piece never ends on a small word that belongs to what follows (a preposition, an
article, "and"), which moves to the next piece when that piece has room for it.
"""
import re

STICKY = {
    "ru": {"в", "во", "на", "с", "со", "к", "у", "о", "и", "а", "но", "из", "за", "по", "не", "ни", "до", "от", "для", "это", "есть", "как", "то"},
    "en": {"a", "an", "the", "of", "to", "in", "on", "at", "is", "it", "and", "or", "no", "not", "for", "as", "so", "its"},
}
MOST = 4


def sentences(text: str) -> list[str]:
    return [s for s in re.split(r"(?<=[.?!])\s+", text.strip()) if s]


def bare(word: str) -> str:
    return re.sub(r"[^\w]", "", word, flags=re.UNICODE).lower()


def pieces(sentence: str, lang: str) -> list[list[str]]:
    words = sentence.split()
    if len(words) <= MOST:
        return [words]
    out = [words[i:i + 3] for i in range(0, len(words), 3)]
    if len(out[-1]) == 1:
        out[-1].insert(0, out[-2].pop())
    sticky = STICKY.get(lang, set())
    for i in range(len(out) - 1):
        while len(out[i]) > 1 and bare(out[i][-1]) in sticky and len(out[i + 1]) < MOST:
            out[i + 1].insert(0, out[i].pop())
    return [p for p in out if p]


def chunks(text: str, lang: str) -> list[str]:
    """the pieces of a line, in order, each a string of one to four words"""
    return [" ".join(p) for s in sentences(text) for p in pieces(s, lang)]


def weights(parts: list[str]) -> list[float]:
    """the share of the speaking time each piece takes: by its letters, never less than a twentieth"""
    sizes = [max(1, len(re.sub(r"[^\w]", "", p, flags=re.UNICODE))) for p in parts]
    total = sum(sizes)
    raw = [max(0.05, s / total) for s in sizes]
    scale = sum(raw)
    return [r / scale for r in raw]
