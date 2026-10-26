import { L } from "@/lib/lang";

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
    { id: "actuarial", label: L("Insurance"), title: L("How does anyone put a price on a fire that has not happened?"), summary: L("What an actuarial model is, from a village sharing one barn fire to the surplus of an insurer, and where heavy tails and long memory, the two halves of what Mandelbrot named, enter it."), piece: "actuarial", state: "planned" },
    { id: "tails", label: L("Heavy tails"), title: L("Claims with a fractal tail"), summary: L("Claim sizes that look the same at every scale, and an average that never settles."), to: "/topics/fractals/uses/tails", state: "built" },
    { id: "credibility", label: L("Credibility"), title: L("Trust the group or trust the record: an actuary's Bayes"), summary: L("A new customer's short record blended with the group's long one, the weight moving as the years arrive."), to: "/topics/fractals/uses/credibility", state: "built" },
    { id: "hurst", label: L("Forecasting"), title: L("A line that remembers: the Hurst exponent"), summary: L("A random walk whose steps remember, measured the way Hurst measured the Nile, and what that buys a forecast."), to: "/topics/fractals/uses/hurst", state: "built" },
    { id: "reservoirs", label: L("Reservoirs"), title: L("How big must a reservoir be?"), summary: L("How big a reservoir has to be when dry years come in runs, and the number Hurst read off the Nile."), piece: "reservoirs", state: "planned" },
    { id: "traffic", label: L("Internet traffic"), title: L("Why does the internet not smooth out?"), summary: L("Network traffic that stays bursty however it is averaged, and what that does to a router's queue."), piece: "traffic", state: "planned" },
    { id: "antennas", label: L("Antennas"), title: L("Can one antenna listen on five frequencies at once?"), summary: L("Why a shape that repeats at several scales answers several frequencies at once."), piece: "antennas", state: "planned" },
  ],
  chaos: [
    { id: "control", label: L("The heart"), title: L("A real heart: the normal beat, the arrhythmia, and back"), summary: L("Recorded human beats, a run of flutter that starts and stops on its own, and the experiment that steadied a chaotic rhythm with timed nudges."), to: "/topics/chaos/uses/control", state: "built" },
    { id: "weather", label: L("Weather"), title: L("Why does the forecast say 70 per cent?"), summary: L("Two nearly identical atmospheres parting ways, the limit that puts on a forecast, and why forecasts are now run many times over."), piece: "weather", state: "planned" },
    { id: "populations", label: L("Populations"), title: L("Why do the flies boom and crash for no reason?"), summary: L("A population that grows by a fixed factor and is limited by its own size, and the years it swings for no outside reason."), piece: "populations", state: "planned" },
    { id: "spacecraft", label: L("Spacecraft"), title: L("How did a probe reach the Moon with almost no fuel?"), summary: L("The balance points between the sun and the planets, and the paths that reach them almost for free."), piece: "spacecraft", state: "planned" },
  ],
  complex: [
    { id: "quaternions", label: L("Quaternions"), title: L("Quaternions"), summary: L("Three imaginary units instead of one, and the turns of a spacecraft, a robot and a phone written in them."), to: "/topics/complex/uses/quaternions", state: "built" },
    { id: "current", label: L("Alternating current"), title: L("Why does a motor draw more current than the work it does?"), summary: L("The mains as a swing fifty times a second, a coil that makes the current arrive a quarter cycle late, the turning arrow that describes it, and the bill that follows."), piece: "current", state: "planned" },
    { id: "frequencies", label: L("Sound and pictures"), title: L("How does a photograph fit in a tenth of the space?"), summary: L("Every picture and every song taken apart into turning arrows, the ones that cannot be seen or heard thrown away, and the rest put back."), piece: "frequencies", state: "planned" },
  ],
  networks: [
    { id: "postcodes", label: L("Postcodes"), title: L("Who read the postcodes on the mail?"), summary: L("The first network that did a job every day, and the pictures it read."), piece: "postcodes", state: "planned" },
    { id: "skin", label: L("Skin cancer"), title: L("Can a photograph tell a mole from a melanoma?"), summary: L("A network judged against dermatologists, and what the comparison did and did not show."), piece: "skin", state: "planned" },
    { id: "speech", label: L("Speech"), title: L("How does a phone hear a word?"), summary: L("A sequence of sounds becoming a sequence of letters, and why the same job needed a memory."), piece: "speech", state: "planned" },
    { id: "proteins", label: L("Proteins"), title: L("How does a string of letters become a shape?"), summary: L("The job biology could not do by hand, and the attention that did it."), piece: "proteins", state: "planned" },
  ],
  tokens: [
    { id: "translation", label: L("Translation"), title: L("Why is a translation written rather than looked up?"), summary: L("Why a translation is generated rather than looked up, and what attention did for it."), piece: "translation", state: "planned" },
    { id: "code", label: L("Code completion"), title: L("What is a program to a model that has only read?"), summary: L("A program as a string of tokens, and a model that has seen a great many."), piece: "code", state: "planned" },
    { id: "search", label: L("Search by meaning"), title: L("How can a search find a page that uses none of the words?"), summary: L("Two texts as two points, and the distance between them as a search."), piece: "search", state: "planned" },
    { id: "spam", label: L("Spam"), title: L("How does a mailbox know which mail to throw away?"), summary: L("The oldest job of text classification, and what tokens did to it."), piece: "spam", state: "planned" },
  ],
};

export function usesOf(slug: string): Use[] {
  return slug in USES ? USES[slug as keyof typeof USES] : [];
}
