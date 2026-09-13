/**
 * byte-pair encoding, built on screen. the alphabet is the 256 byte values, so
 * every string is representable and there is no unknown token. training is a
 * loop the reader can watch: count adjacent pairs, merge the most frequent one
 * into a new symbol, repeat. encoding is a replay of those merges in order,
 * and decoding is a concatenation of bytes.
 *
 * words are split before merging, with a leading space attached to the word
 * that follows it, so a token can carry the space inside it and merges never
 * cross a word boundary. that is the convention most modern vocabularies use.
 */

import { decodeBytes, encodeBytes } from "./text.ts";

export type Symbol = number; // 0..255 are bytes, 256+ are merged symbols
export type Merge = { a: Symbol; b: Symbol; into: Symbol; count: number };

export type Vocab = {
  merges: Merge[];
  /** the bytes each symbol stands for */
  bytes: number[][];
};

/** the pieces of text merges may not cross: words with their leading space. */
export function pretokenise(text: string): string[] {
  const out: string[] = [];
  const re = /\s*\S+|\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0]);
  return out;
}

export function emptyVocab(): Vocab {
  return { merges: [], bytes: Array.from({ length: 256 }, (_, i) => [i]) };
}

/** a word as its current symbols under the merges made so far. */
export type Word = { symbols: Symbol[]; count: number };

export function startWords(corpus: string): Word[] {
  const counts = new Map<string, number>();
  for (const w of pretokenise(corpus)) counts.set(w, (counts.get(w) ?? 0) + 1);
  return Array.from(counts, ([w, count]) => ({ symbols: encodeBytes(w), count }));
}

/** every adjacent pair and how often it occurs, weighted by word frequency. */
export function pairCounts(words: Word[]): Map<string, { a: Symbol; b: Symbol; count: number }> {
  const out = new Map<string, { a: Symbol; b: Symbol; count: number }>();
  for (const w of words) {
    for (let i = 0; i + 1 < w.symbols.length; i++) {
      const a = w.symbols[i];
      const b = w.symbols[i + 1];
      const key = a + "," + b;
      const got = out.get(key);
      if (got) got.count += w.count;
      else out.set(key, { a, b, count: w.count });
    }
  }
  return out;
}

export function mostFrequent(pairs: Map<string, { a: Symbol; b: Symbol; count: number }>) {
  let best: { a: Symbol; b: Symbol; count: number } | null = null;
  for (const p of pairs.values()) {
    if (!best || p.count > best.count || (p.count === best.count && (p.a < best.a || (p.a === best.a && p.b < best.b)))) best = p;
  }
  return best;
}

export function applyMerge(symbols: Symbol[], a: Symbol, b: Symbol, into: Symbol): Symbol[] {
  const out: Symbol[] = [];
  for (let i = 0; i < symbols.length; i++) {
    if (symbols[i] === a && i + 1 < symbols.length && symbols[i + 1] === b) {
      out.push(into);
      i += 1;
    } else out.push(symbols[i]);
  }
  return out;
}

/** one training step: the most frequent pair becomes a symbol. returns null when nothing is left to merge. */
export function mergeOnce(vocab: Vocab, words: Word[]): { vocab: Vocab; words: Word[]; merge: Merge } | null {
  const best = mostFrequent(pairCounts(words));
  if (!best || best.count < 2) return null;
  const into = vocab.bytes.length;
  const merge: Merge = { a: best.a, b: best.b, into, count: best.count };
  return {
    vocab: { merges: [...vocab.merges, merge], bytes: [...vocab.bytes, [...vocab.bytes[best.a], ...vocab.bytes[best.b]]] },
    words: words.map((w) => ({ symbols: applyMerge(w.symbols, best.a, best.b, into), count: w.count })),
    merge,
  };
}

/** the whole training, for pages that want the finished vocabulary. */
export function train(corpus: string, merges: number): Vocab {
  let vocab = emptyVocab();
  let words = startWords(corpus);
  for (let i = 0; i < merges; i++) {
    const next = mergeOnce(vocab, words);
    if (!next) break;
    vocab = next.vocab;
    words = next.words;
  }
  return vocab;
}

export type Token = { id: Symbol; bytes: number[]; text: string };

export function tokenText(vocab: Vocab, id: Symbol) {
  const bytes = vocab.bytes[id];
  const text = decodeBytes(bytes);
  // a lone continuation byte or a split character is not printable; show it as hex
  return text.includes("�") ? bytes.map((b) => "<" + b.toString(16).padStart(2, "0") + ">").join("") : text;
}

/** encode by replaying the merges in order, word by word. `upTo` replays only the first so many, for watching. */
export function encode(vocab: Vocab, text: string, upTo = vocab.merges.length): Token[] {
  const out: Token[] = [];
  for (const w of pretokenise(text)) {
    let symbols = encodeBytes(w);
    for (let i = 0; i < Math.min(upTo, vocab.merges.length); i++) {
      const m = vocab.merges[i];
      symbols = applyMerge(symbols, m.a, m.b, m.into);
    }
    for (const id of symbols) out.push({ id, bytes: vocab.bytes[id], text: tokenText(vocab, id) });
  }
  return out;
}

export function decode(vocab: Vocab, ids: Symbol[]): string {
  const bytes: number[] = [];
  for (const id of ids) bytes.push(...vocab.bytes[id]);
  return decodeBytes(bytes);
}

/** whether decoding the encoding gives the text back, byte for byte. */
export function roundTrip(vocab: Vocab, text: string) {
  const back = decode(vocab, encode(vocab, text).map((t) => t.id));
  return { exact: back === text, back };
}

/** the number of times each symbol appears in a corpus, for the frequency-ordered view. */
export function frequencies(vocab: Vocab, corpus: string): Map<Symbol, number> {
  const out = new Map<Symbol, number>();
  for (const t of encode(vocab, corpus)) out.set(t.id, (out.get(t.id) ?? 0) + 1);
  return out;
}

/**
 * the small corpus everything in this topic is trained on. it is original
 * text, short enough to read, with a few things said many ways so that a tiny
 * model has something to learn and rare words have somewhere to be rare.
 */
export const CORPUS = `the cat sleeps on the warm mat by the window. the dog sleeps on the cold floor by the door.
the cat likes the warm mat and the dog likes the cold floor. in the morning the cat sits by the window and watches the birds.
in the evening the dog sits by the door and waits for the man. the man comes home and the dog runs to the door.
the cat does not run. the cat watches the dog run and goes back to sleep on the warm mat.
the birds sit in the tree by the window. the cat watches the birds in the tree. the dog does not watch the birds.
the dog watches the door. the man opens the door and the dog runs out into the garden. the cat stays on the mat.
the garden is cold in the morning and warm in the evening. the birds sing in the garden in the morning.
the man walks in the garden with the dog. the cat sleeps. the cat sleeps on the warm mat by the window.
when the man comes home the dog is happy and the cat is asleep. when the birds sing the cat is awake and the dog is asleep.
the man reads by the window in the evening. the cat sits on the man and the dog sleeps by the door.
the mat is warm because the sun comes in the window. the floor is cold because the door is open.
the dog likes the man and the man likes the dog. the cat likes the mat and the mat likes nobody.
the river runs past the garden. the man walks to the river with the dog in the evening. the dog swims in the river.
the cat does not swim. the cat watches the river from the window and goes back to sleep.
the birds fly over the river in the morning. the man watches the birds fly and the dog watches the man.
in winter the garden is white and the river is slow. in summer the garden is green and the river is quick.
the cat sleeps more in winter. the dog runs more in summer. the man reads more in winter and walks more in summer.
the window is open in summer and shut in winter. the door is shut at night. the cat sleeps at night on the mat by the window.
the dog dreams of the river. the cat dreams of the birds. the man dreams of nothing and sleeps by the window.`;
