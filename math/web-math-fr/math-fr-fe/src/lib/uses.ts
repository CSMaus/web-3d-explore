/**
 * the applications of each topic: the thing in the world first, the topic's
 * idea entering as the explanation of one part of it. built ones have a page;
 * planned ones are named so the section shows what is coming.
 */
export type Use = {
  id: string;
  /** the tab */
  label: string;
  /** the page's own heading */
  title: string;
  summary: string;
  to?: UsesRoute;
  /** a written piece under /topics/<slug>/uses/<piece>, when the text exists */
  piece?: string;
  state: "built" | "planned";
};

export type UsesRoute =
  | "/topics/fractals/uses/hurst"
  | "/topics/fractals/uses/credibility"
  | "/topics/fractals/uses/tails"
  | "/topics/chaos/uses/control"
  | "/topics/complex/uses/quaternions";

export type UsesIndexRoute = "/topics/fractals/uses" | "/topics/chaos/uses" | "/topics/complex/uses" | "/topics/networks/uses" | "/topics/tokens/uses";
export type PieceRoute = "/topics/fractals/uses/$piece" | "/topics/chaos/uses/$piece" | "/topics/complex/uses/$piece" | "/topics/networks/uses/$piece" | "/topics/tokens/uses/$piece";

export const USES: Record<"fractals" | "chaos" | "complex" | "networks" | "tokens", Use[]> = {
  fractals: [
    { id: "actuarial", label: "Insurance", title: "How does anyone put a price on a fire that has not happened?", summary: "What an actuarial model is, from a village sharing one barn fire to the surplus of an insurer, and where heavy tails and long memory, the two halves of what Mandelbrot named, enter it.", piece: "actuarial", state: "planned" },
    { id: "tails", label: "Heavy tails", title: "Claims with a fractal tail", summary: "Claim sizes that look the same at every scale, and an average that never settles.", to: "/topics/fractals/uses/tails", state: "built" },
    { id: "credibility", label: "Credibility", title: "Trust the group or trust the record: an actuary's Bayes", summary: "A new customer's short record blended with the group's long one, the weight moving as the years arrive.", to: "/topics/fractals/uses/credibility", state: "built" },
    { id: "hurst", label: "Forecasting", title: "A line that remembers: the Hurst exponent", summary: "A random walk whose steps remember, measured the way Hurst measured the Nile, and what that buys a forecast.", to: "/topics/fractals/uses/hurst", state: "built" },
    { id: "reservoirs", label: "Reservoirs", title: "How big must a reservoir be?", summary: "How big a reservoir has to be when dry years come in runs, and the number Hurst read off the Nile.", piece: "reservoirs", state: "planned" },
    { id: "traffic", label: "Internet traffic", title: "Why does the internet not smooth out?", summary: "Network traffic that stays bursty however it is averaged, and what that does to a router's queue.", piece: "traffic", state: "planned" },
    { id: "antennas", label: "Antennas", title: "Can one antenna listen on five frequencies at once?", summary: "Why a shape that repeats at several scales answers several frequencies at once.", piece: "antennas", state: "planned" },
  ],
  chaos: [
    { id: "control", label: "The heart", title: "A real heart: the normal beat, the arrhythmia, and back", summary: "Recorded human beats, a run of flutter that starts and stops on its own, and the experiment that steadied a chaotic rhythm with timed nudges.", to: "/topics/chaos/uses/control", state: "built" },
    { id: "weather", label: "Weather", title: "Why does the forecast say 70 per cent?", summary: "Two nearly identical atmospheres parting ways, the limit that puts on a forecast, and why forecasts are now run many times over.", piece: "weather", state: "planned" },
    { id: "populations", label: "Populations", title: "Why do the flies boom and crash for no reason?", summary: "A population that grows by a fixed factor and is limited by its own size, and the years it swings for no outside reason.", piece: "populations", state: "planned" },
    { id: "spacecraft", label: "Spacecraft", title: "How did a probe reach the Moon with almost no fuel?", summary: "The balance points between the sun and the planets, and the paths that reach them almost for free.", piece: "spacecraft", state: "planned" },
  ],
  complex: [
    { id: "quaternions", label: "Quaternions", title: "Quaternions", summary: "Three imaginary units instead of one, and the turns of a spacecraft, a robot and a phone written in them.", to: "/topics/complex/uses/quaternions", state: "built" },
    { id: "current", label: "Alternating current", title: "Why does a motor draw more current than the work it does?", summary: "The mains as a swing fifty times a second, a coil that makes the current arrive a quarter cycle late, the turning arrow that describes it, and the bill that follows.", piece: "current", state: "planned" },
    { id: "frequencies", label: "Sound and pictures", title: "How does a photograph fit in a tenth of the space?", summary: "Every picture and every song taken apart into turning arrows, the ones that cannot be seen or heard thrown away, and the rest put back.", piece: "frequencies", state: "planned" },
  ],
  networks: [
    { id: "postcodes", label: "Postcodes", title: "Who read the postcodes on the mail?", summary: "The first network that did a job every day, and the pictures it read.", piece: "postcodes", state: "planned" },
    { id: "skin", label: "Skin cancer", title: "Can a photograph tell a mole from a melanoma?", summary: "A network judged against dermatologists, and what the comparison did and did not show.", piece: "skin", state: "planned" },
    { id: "speech", label: "Speech", title: "How does a phone hear a word?", summary: "A sequence of sounds becoming a sequence of letters, and why the same job needed a memory.", piece: "speech", state: "planned" },
    { id: "proteins", label: "Proteins", title: "How does a string of letters become a shape?", summary: "The job biology could not do by hand, and the attention that did it.", piece: "proteins", state: "planned" },
  ],
  tokens: [
    { id: "translation", label: "Translation", title: "Why is a translation written rather than looked up?", summary: "Why a translation is generated rather than looked up, and what attention did for it.", piece: "translation", state: "planned" },
    { id: "code", label: "Code completion", title: "What is a program to a model that has only read?", summary: "A program as a string of tokens, and a model that has seen a great many.", piece: "code", state: "planned" },
    { id: "search", label: "Search by meaning", title: "How can a search find a page that uses none of the words?", summary: "Two texts as two points, and the distance between them as a search.", piece: "search", state: "planned" },
    { id: "spam", label: "Spam", title: "How does a mailbox know which mail to throw away?", summary: "The oldest job of text classification, and what tokens did to it.", piece: "spam", state: "planned" },
  ],
};

export function usesOf(slug: string): Use[] {
  return slug in USES ? USES[slug as keyof typeof USES] : [];
}
