/**
 * text before any model sees it: characters, code points and bytes, and the
 * two ways one visible letter can be spelt. everything is computed from the
 * string the reader typed, with the platform's own encoder, so the counts are
 * the real counts.
 */

const enc = new TextEncoder();
const dec = new TextDecoder("utf-8", { fatal: false });

export type Char = {
  /** what a person sees: one code point, or one base letter with its combining marks */
  shown: string;
  /** the code points in it */
  points: number[];
  /** the UTF-8 bytes in it */
  bytes: number[];
};

/** the string as a person reads it: one entry per grapheme, with its code points and bytes. */
export function chars(text: string): Char[] {
  const seg = typeof Intl !== "undefined" && "Segmenter" in Intl
    ? Array.from(new (Intl as unknown as { Segmenter: new (l: string, o: object) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter("en", { granularity: "grapheme" }).segment(text), (s) => s.segment)
    : Array.from(text);
  return seg.map((shown) => ({
    shown,
    points: Array.from(shown, (c) => c.codePointAt(0) as number),
    bytes: Array.from(enc.encode(shown)),
  }));
}

export const encodeBytes = (text: string): number[] => Array.from(enc.encode(text));
export const decodeBytes = (bytes: number[]): string => dec.decode(new Uint8Array(bytes));

export function hex(b: number) {
  return b.toString(16).padStart(2, "0");
}

export function codePoint(p: number) {
  return "U+" + p.toString(16).toUpperCase().padStart(4, "0");
}

/** how many bytes a leading byte says its character has; 0 for a continuation byte. */
export function utf8Length(lead: number) {
  if (lead < 0x80) return 1;
  if (lead >= 0xc0 && lead < 0xe0) return 2;
  if (lead >= 0xe0 && lead < 0xf0) return 3;
  if (lead >= 0xf0) return 4;
  return 0;
}

/** the same sentence in several scripts, for counting. */
export const SAMPLES: { id: string; label: string; text: string }[] = [
  { id: "en", label: "English", text: "the cat sleeps on the warm mat by the window" },
  { id: "fr", label: "French", text: "le chat dort sur le tapis chaud près de la fenêtre" },
  { id: "de", label: "German", text: "die Katze schläft auf der warmen Matte am Fenster" },
  { id: "es", label: "Spanish", text: "el gato duerme sobre la alfombra caliente junto a la ventana" },
  { id: "ru", label: "Russian", text: "кошка спит на тёплом коврике у окна" },
  { id: "el", label: "Greek", text: "η γάτα κοιμάται στο ζεστό χαλάκι δίπλα στο παράθυρο" },
  { id: "hi", label: "Hindi", text: "बिल्ली खिड़की के पास गर्म चटाई पर सोती है" },
  { id: "ar", label: "Arabic", text: "القطة تنام على السجادة الدافئة بجانب النافذة" },
  { id: "zh", label: "Chinese", text: "猫睡在窗边温暖的垫子上" },
  { id: "ja", label: "Japanese", text: "猫は窓のそばの暖かいマットで眠っている" },
  { id: "emoji", label: "Emoji", text: "the cat 🐈 sleeps 😴 by the window 🪟" },
];

/** two spellings of one visible letter: one code point, and a base letter with a combining mark. */
export const TWO_SPELLINGS = {
  composed: "café",
  decomposed: "café",
};

export const normalise = (text: string, form: "NFC" | "NFD") => text.normalize(form);
