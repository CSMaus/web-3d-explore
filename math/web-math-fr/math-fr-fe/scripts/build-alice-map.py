"""
the map of the Alice book for the projects page, from the Alice in Wonderland project's own
embeddings (its 300-token passages, data/alice_embeddings_fine.npz): each passage placed by the
two directions in which the embeddings differ most, with its chapter, the start of its text, the
example tags the page lights, and its five closest passages by cosine similarity; the counts of
passages at every size and of the generated pairs go in `meta`. the key file in that repository is
never read.

    uv run --with numpy python build-alice-map.py ~/Documents/GitHub/Alice-in-Wonderland/data ../src/content/projects/alice-map.json
"""
import json, re, sys
import numpy as np
root = sys.argv[1].rstrip("/") + "/"
d = np.load(root + "alice_embeddings_fine.npz")
E = d["embeddings"].astype(np.float64); chunks = [str(c) for c in d["chunks"]]
E /= np.linalg.norm(E, axis=1, keepdims=True)
C = E - E.mean(0)
U, S, Vt = np.linalg.svd(C, full_matrices=False)
P = C @ Vt[:2].T
P = (P - P.min(0)) / (P.max(0) - P.min(0))
book = open(root + "AliceInWonderlands.txt", encoding="utf-8").read()
heads = [(m.start(), m.group(1)) for m in re.finditer(r"\nCHAPTER ([IVXL]+)\.", book)]
roman = {"I":1,"II":2,"III":3,"IV":4,"V":5,"VI":6,"VII":7,"VIII":8,"IX":9,"X":10,"XI":11,"XII":12}
def chapter(text):
    key = " ".join(text.split()[3:12])
    flat = " ".join(book.split())
    at = flat.find(key)
    if at < 0: return 0
    # position in flat text back to chapter by counting heads in flat
    n = 0
    for m in re.finditer(r"CHAPTER ([IVXL]+)\.", flat):
        if m.start() <= at: n = roman.get(m.group(1), n)
    return n
def excerpt(text, n=240):
    t = " ".join(text.split())
    t = t[t.find(" ") + 1:] if not t[0].isupper() and " " in t else t
    if len(t) <= n: return t
    cut = t[:n]
    return cut[: cut.rfind(" ")] + " ..."
sims = E @ E.T
out = []
for i, c in enumerate(chunks):
    order = [j for j in np.argsort(-sims[i]) if j != i][:5]
    tags = [k for k, w in (("duchess", "moral"), ("soldiers", "soldier")) if w in c.lower()]
    out.append({"x": round(float(P[i,0]), 4), "y": round(float(P[i,1]), 4), "chapter": chapter(c), "text": excerpt(c).replace("\u2014", " - ").replace("\u2013", "-").replace("_", ""), "tags": tags,
                "near": [[int(j), round(float(sims[i, j]), 2)] for j in order]})
meta = {"sizes": [], "pairs": 0}
for n in ["short", "fine", "medium", "coarse"]:
    meta["sizes"].append({"name": n, "passages": int(np.load(root + f"alice_embeddings_{n}.npz")["embeddings"].shape[0])})
meta["pairs"] = sum(1 for l in open(root + "alice_dataset_expanded.json") if l.strip())
lo = float(np.min(sims[np.triu_indices(len(chunks), 1)])); hi = float(np.max(sims[np.triu_indices(len(chunks), 1)]))
meta["simRange"] = [round(lo, 2), round(hi, 2)]
json.dump({"meta": meta, "passages": out}, open(sys.argv[2], "w"), ensure_ascii=False, separators=(",", ":"))
print(meta, len(out), sorted(set(p["chapter"] for p in out)))
