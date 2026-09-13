"""
the beat intervals of one record of the MIT-BIH Arrhythmia Database, as the
typed data module a page shows. run from a directory holding the record's
.atr and .hea files, fetched from https://physionet.org/files/mitdb/1.0.0/:

    uvx --with wfdb python extract-mitdb.py 207 ../src/data/mitdb207.ts

the beat annotations are kept (the codes below; ! is a ventricular flutter
wave), the time from each to the next is taken in milliseconds, and each beat
carries its type and the rhythm named by the last + annotation before it.
nothing is edited by hand; the licence (ODC-BY 1.0) and the source stay in the
file's header.
"""

import json
import sys

import wfdb

BEATS = set("NLRBAaJSVrFejnE/fQ!")

HEADER = """/**
 * a real heart: record {rec} of the MIT-BIH Arrhythmia Database, thirty minutes of one
 * patient's electrocardiogram recorded at Boston's Beth Israel Hospital between 1975 and
 * 1979, every beat marked by cardiologists. the numbers here are the intervals between
 * consecutive marked beats, in milliseconds, with the beat's type and the rhythm the
 * cardiologists named at that moment. nothing is generated.
 *
 * source: Moody GB, Mark RG, IEEE Eng Med Biol 20(3):45-50, 2001; Goldberger AL et al.,
 * Circulation 101(23):e215-e220, 2000. PhysioNet, doi 10.13026/C2F305. licence: Open Data
 * Commons Attribution 1.0. the file was produced from {rec}.atr by scripts/extract-mitdb.py
 * with no hand edits.
 */
"""

TYPES = """/** beat types, in the database's own codes */
export const TYPES: Record<string, string> = {
  L: "normal beat, conducted with left bundle branch block",
  R: "normal beat, conducted with right bundle branch block",
  N: "normal beat",
  A: "premature beat from the atria",
  V: "premature beat from the ventricles",
  E: "escape beat from the ventricles",
  "!": "ventricular flutter wave",
  F: "fusion of a normal and a ventricular beat",
};
/** rhythm names, in the database's own codes */
export const RHYTHMS: Record<string, string> = {
  N: "normal sinus rhythm",
  B: "ventricular bigeminy: every other beat premature",
  VT: "ventricular tachycardia",
  VFL: "ventricular flutter",
  IVR: "idioventricular rhythm: the ventricles pacing themselves",
  SVTA: "supraventricular tachyarrhythmia",
};
export type Beat = { t: number; rr: number; type: string; rhythm: string };
"""


def main(rec: str, out_path: str) -> None:
    ann = wfdb.rdann(rec, "atr")
    header = wfdb.rdheader(rec)
    fs = ann.fs
    seconds = round(header.sig_len / fs, 3)
    rows = []
    segments: list[dict] = []
    rhythm = None
    for sample, sym, aux in zip(ann.sample, ann.symbol, ann.aux_note):
        aux = aux.strip("\x00")
        if sym == "+" and aux.startswith("("):
            if segments and segments[-1]["to"] is None:
                segments[-1]["to"] = round(sample / fs, 3)
            rhythm = aux[1:]
            segments.append({"from": round(sample / fs, 3), "to": None, "label": rhythm})
        if sym in BEATS:
            rows.append((round(sample / fs, 3), sym, rhythm))
    if segments and segments[-1]["to"] is None:
        segments[-1]["to"] = seconds
    beats = [
        [t, round((rows[i + 1][0] - t) * 1000), sym, rhythm]
        for i, (t, sym, rhythm) in enumerate(rows[:-1])
    ]
    lines = [HEADER.format(rec=rec), f'export const RECORD = "{rec}";\nexport const SECONDS = {seconds};\n', TYPES]
    lines.append("/** [time in seconds, interval to the next beat in ms, beat type, rhythm] */\n")
    lines.append("const RAW: [number, number, string, string][] = [\n")
    line = "  "
    for beat in beats:
        item = json.dumps(beat, separators=(",", ":"))
        if len(line) + len(item) > 118:
            lines.append(line.rstrip() + "\n")
            line = "  "
        line += item + ", "
    lines.append(line.rstrip() + "\n];\n")
    lines.append("export const BEATS: Beat[] = RAW.map(([t, rr, type, rhythm]) => ({ t, rr, type, rhythm }));\n")
    segs = json.dumps(segments, separators=(",", ":"))
    for key in ("from", "to", "label"):
        segs = segs.replace(f'"{key}"', key)
    lines.append(
        "/** the rhythm the cardiologists named, from one time to the next */\n"
        f"export const SEGMENTS: {{ from: number; to: number; label: string }}[] = {segs};\n"
    )
    with open(out_path, "w") as f:
        f.write("".join(lines))
    print(f"{len(beats)} beats, {len(segments)} rhythm segments -> {out_path}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
