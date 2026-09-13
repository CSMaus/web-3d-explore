import { useEffect, useState } from "react";
import { CORPUS, decode, encode, frequencies, train, type Vocab } from "@/systems/bpe";
import { adam, makeModel, skipGram, skipGramStep, trainStep, type Model, type SkipGram } from "@/systems/lm";
import { rng } from "@/systems/net";

/**
 * the one vocabulary, the one corpus and the two small models every page of
 * topic 4 shares. training runs in the browser, in chunks between frames, and
 * every page reads the same objects, so a token means the same thing on all of
 * them and a model trained on one page is trained on the next.
 */
export const MERGES = 150;
export const WIDTH = 16;
export const CONTEXT = 12;
export const MODEL_STEPS = 3000;
export const SKIP_STEPS = 60000;

export const VOCAB: Vocab = train(CORPUS, MERGES);
export const IDS: number[] = encode(VOCAB, CORPUS).map((t) => t.id);
const FREQ = frequencies(VOCAB, CORPUS);
/** the symbols that occur in the corpus, most frequent first */
export const USED: number[] = Array.from(FREQ).sort((a, b) => b[1] - a[1]).map(([id]) => id);
export const countOf = (id: number) => FREQ.get(id) ?? 0;
export const text = (id: number) => decode(VOCAB, [id]);
export const tokenIds = (s: string) => encode(VOCAB, s).map((t) => t.id);

type Store = {
  model: Model;
  step: (p: number[], g: number[]) => void;
  next: () => number;
  skip: SkipGram;
  skipNext: () => number;
  /** loss history of the model, one entry a chunk */
  history: [number, number][];
  skipHistory: [number, number][];
  version: number;
};

function fresh(): Store {
  const model = makeModel(VOCAB.bytes.length, WIDTH, CONTEXT, 1);
  return {
    model,
    step: adam(VOCAB.bytes.length * WIDTH + CONTEXT * WIDTH + 3 * WIDTH * WIDTH, 0.01),
    next: rng(4),
    skip: skipGram(VOCAB.bytes.length, 8, 2),
    skipNext: rng(9),
    history: [],
    skipHistory: [],
    version: 0,
  };
}

export const store: Store = fresh();
const listeners = new Set<() => void>();
const emit = () => {
  store.version += 1;
  for (const l of listeners) l();
};

export function stepModel(n: number) {
  for (let i = 0; i < n; i++) trainStep(store.model, IDS, store.step, store.next);
  store.history.push([store.model.steps, store.model.loss]);
  emit();
}

export function stepSkip(n: number) {
  for (let i = 0; i < n; i++) skipGramStep(store.skip, IDS, 0.05, 3, 4, store.skipNext);
  store.skipHistory.push([store.skip.steps, store.skip.loss]);
  emit();
}

/** stop any background training loop, for a reset that must stay reset. */
export function haltBackground() {
  if (modelLoop !== null) cancelAnimationFrame(modelLoop);
  if (skipLoop !== null) cancelAnimationFrame(skipLoop);
  modelLoop = null;
  skipLoop = null;
}

export function resetModel() {
  haltBackground();
  const f = fresh();
  store.model = f.model;
  store.step = f.step;
  store.next = f.next;
  store.history = [];
  emit();
}

export function resetSkip() {
  haltBackground();
  const f = fresh();
  store.skip = f.skip;
  store.skipNext = f.skipNext;
  store.skipHistory = [];
  emit();
}

let modelLoop: number | null = null;
let skipLoop: number | null = null;

/** train the model up to the shared target in the background, a chunk a frame. */
export function ensureModel(target = MODEL_STEPS) {
  if (modelLoop !== null || store.model.steps >= target) return;
  const tick = () => {
    stepModel(60);
    if (store.model.steps < target) modelLoop = requestAnimationFrame(tick);
    else modelLoop = null;
  };
  modelLoop = requestAnimationFrame(tick);
}

export function ensureSkip(target = SKIP_STEPS) {
  if (skipLoop !== null || store.skip.steps >= target) return;
  const tick = () => {
    stepSkip(2500);
    if (store.skip.steps < target) skipLoop = requestAnimationFrame(tick);
    else skipLoop = null;
  };
  skipLoop = requestAnimationFrame(tick);
}

/** re-render when the shared models change; optionally start their training. */
export function useTiny(want: { model?: boolean; skip?: boolean } = {}) {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((v) => v + 1);
    listeners.add(l);
    if (want.model) ensureModel();
    if (want.skip) ensureSkip();
    return () => {
      listeners.delete(l);
    };
  }, [want.model, want.skip]);
  return store;
}
