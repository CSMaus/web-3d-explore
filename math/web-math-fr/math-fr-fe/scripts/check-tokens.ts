/**
 * the measurements topic 4 rests on, printed against what they must be:
 * the byte-pair round trip is exact, the merge loop shortens the corpus,
 * skip-gram brings neighbours together, the tiny attention model's gradient
 * agrees with nudging, its loss falls, and the decoding rules sum to one.
 */
import { CORPUS, decode, encode, frequencies, roundTrip, startWords, train } from "../src/systems/bpe.ts";
import { SAMPLES, chars, encodeBytes } from "../src/systems/text.ts";
import {
  GREEDY,
  adam,
  backward,
  cosine,
  flattenGrads,
  forward,
  lossOf,
  makeModel,
  nearest,
  numericalGrad,
  perplexity,
  project2,
  shape,
  skipGram,
  skipGramStep,
  trainStep,
  worstDisagreement,
} from "../src/systems/lm.ts";
import { rng } from "../src/systems/net.ts";

const line = (label: string, value: string, note = "") => console.log(`  ${label.padEnd(36)} ${value.padStart(14)}   ${note}`);

console.log("text");
for (const s of SAMPLES.slice(0, 11)) {
  const c = chars(s.text);
  line(s.label, `${c.length} chars, ${encodeBytes(s.text).length} bytes`, `${(encodeBytes(s.text).length / c.length).toFixed(2)} bytes a character`);
}

console.log("\nbyte-pair encoding");
const words = startWords(CORPUS);
const bytesTotal = words.reduce((s, w) => s + w.symbols.length * w.count, 0);
line("Corpus bytes", String(bytesTotal));
for (const merges of [0, 20, 60, 150, 300]) {
  const v = train(CORPUS, merges);
  const toks = encode(v, CORPUS);
  const rt = roundTrip(v, CORPUS);
  line(`${merges} merges`, `${v.bytes.length} symbols, ${toks.length} tokens`, `round trip ${rt.exact ? "exact" : "BROKEN"}`);
}
const vocab = train(CORPUS, 150);
for (const s of SAMPLES) {
  const t = encode(vocab, s.text);
  const rt = roundTrip(vocab, s.text);
  line(s.label, `${t.length} tokens / ${chars(s.text).length} chars`, `${(t.length / chars(s.text).length).toFixed(2)} tokens a character, round trip ${rt.exact ? "exact" : "BROKEN"}`);
}
const freq = frequencies(vocab, CORPUS);
const top = Array.from(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
line("Most frequent tokens", top.map(([id, n]) => `${JSON.stringify(decode(vocab, [id]))}:${n}`).join(" "));

console.log("\nskip-gram");
const ids = encode(vocab, CORPUS).map((t) => t.id);
const used = Array.from(new Set(ids));
const sg = skipGram(vocab.bytes.length, 8, 2);
const nextSg = rng(9);
const tokenOf = (s: string) => encode(vocab, s)[0].id;
const cat = tokenOf(" cat");
const dog = tokenOf(" dog");
const before = cosine(sg.E[cat], sg.E[dog]);
for (let i = 0; i < 60000; i++) skipGramStep(sg, ids, 0.05, 3, 4, nextSg);
line("Cos(cat, dog) before", before.toFixed(3));
line("Cos(cat, dog) after", cosine(sg.E[cat], sg.E[dog]).toFixed(3), "The two animals share their contexts");
line("Nearest to ' cat'", nearest(sg.E, cat, 4, (i) => used.includes(i)).map((n) => JSON.stringify(decode(vocab, [n.id]))).join(" "));
const proj = project2(used.map((i) => sg.E[i]));
line("Two axes keep", `${(proj.kept * 100).toFixed(0)} %`, "Of the spread; the rest is what the flat picture cannot show");

console.log("\nthe tiny attention model");
const small = makeModel(12, 6, 5, 3);
const seq = [3, 7, 1, 7, 9];
const got = flattenGrads(backward(small, seq).grads);
const want = numericalGrad(small, seq);
line("Gradient vs nudging, worst", worstDisagreement(got, want).toExponential(2), "Must be tiny");
const model = makeModel(vocab.bytes.length, 16, 12, 1);
const step = adam(model.E.length * 16 + 12 * 16 + 3 * 16 * 16, 0.01);
const nextT = rng(4);
const first = lossOf(forward(model, ids.slice(0, 12)), ids.slice(0, 12));
for (let i = 0; i < 3000; i++) trainStep(model, ids, step, nextT);
line("Loss at start", first.toFixed(3), `perplexity ${perplexity(first).toFixed(0)}`);
line("Loss after 3000 steps", model.loss.toFixed(3), `perplexity ${perplexity(model.loss).toFixed(1)}`);
const prompt = encode(vocab, "the cat sleeps on the").map((t) => t.id);
const p = forward(model, prompt).probs[prompt.length - 1];
const ranked = p.map((v, i) => [i, v] as [number, number]).sort((a, b) => b[1] - a[1]).slice(0, 5);
line("After 'the cat sleeps on the'", ranked.map(([i, v]) => `${JSON.stringify(decode(vocab, [i]))} ${(v * 100).toFixed(0)}%`).join(" "));

console.log("\ndecoding");
const logits = forward(model, prompt).logits[prompt.length - 1];
for (const [name, rule] of [
  ["greedy", GREEDY],
  ["Temperature 0.7", { temperature: 0.7, topK: 0, topP: 1, penalty: 0 }],
  ["Temperature 2", { temperature: 2, topK: 0, topP: 1, penalty: 0 }],
  ["Top 3", { temperature: 1, topK: 3, topP: 1, penalty: 0 }],
  ["Nucleus 0.9", { temperature: 1, topK: 0, topP: 0.9, penalty: 0 }],
] as const) {
  const q = shape(logits, rule);
  const live = q.filter((v) => v > 0).length;
  line(name, `${live} candidates`, `sums to ${q.reduce((a, b) => a + b, 0).toFixed(6)}, top ${(Math.max(...q) * 100).toFixed(0)} %`);
}
