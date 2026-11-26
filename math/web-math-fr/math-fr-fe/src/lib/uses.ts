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

export type UsesIndexRoute = "/topics/fractals/uses" | "/topics/chaos/uses" | "/topics/complex/uses" | "/topics/networks/uses" | "/topics/tokens/uses" | "/topics/series/uses" | "/topics/probability/uses";
export type PieceRoute = "/topics/fractals/uses/$piece" | "/topics/chaos/uses/$piece" | "/topics/complex/uses/$piece" | "/topics/networks/uses/$piece" | "/topics/tokens/uses/$piece" | "/topics/series/uses/$piece" | "/topics/probability/uses/$piece";

export const USES: Record<"fractals" | "chaos" | "complex" | "networks" | "tokens" | "series" | "probability", Use[]> = {
  fractals: [
    { id: "actuarial", label: L("Insurance"), title: L("How does anyone put a price on a fire that has not happened?"), summary: L("What an insurer's model is, from a village sharing the cost of one barn fire to a company's money over thirty years, and where two facts break it: a few enormous claims, and bad years that come in runs."), piece: "actuarial", state: "planned" },
    { id: "tails", label: L("Rare huge claims"), title: L("When one claim outweighs a thousand"), summary: L("Most insurance claims are small and a few are enormous. The large ones thin out in the same way at every size, and their average never settles."), to: "/topics/fractals/uses/tails", state: "built" },
    { id: "credibility", label: L("Pricing a new customer"), title: L("How much to trust a new customer's own record"), summary: L("A price for a new customer that mixes a short personal record with the long record of a group, and how the share given to the personal record grows year by year."), to: "/topics/fractals/uses/credibility", state: "built" },
    { id: "hurst", label: L("Forecasting"), title: L("Does a river remember its past years? The Hurst exponent"), summary: L("A line built from random steps that remember the earlier steps, the number H that measures this memory, and what it says about a forecast."), to: "/topics/fractals/uses/hurst", state: "built" },
    { id: "reservoirs", label: L("Reservoirs"), title: L("How big must a reservoir be?"), summary: L("How big a reservoir has to be when dry years come in runs, and the number Hurst measured on the Nile."), piece: "reservoirs", state: "planned" },
    { id: "traffic", label: L("Internet traffic"), title: L("Why does internet traffic not even out?"), summary: L("Network traffic that stays uneven however long it is averaged over, and what that does to the queue of data waiting in a router."), piece: "traffic", state: "planned" },
    { id: "antennas", label: L("Antennas"), title: L("Can one antenna listen on five frequencies at once?"), summary: L("Why a metal shape that repeats itself at several sizes picks up several radio frequencies at once."), piece: "antennas", state: "planned" },
  ],
  chaos: [
    { id: "control", label: L("The heart"), title: L("A real heart: from the normal beat to a very fast rhythm and back"), summary: L("Half an hour of one real person's heartbeat, with spells of a very fast rhythm that start and stop on their own. Also the experiment that made an irregular heartbeat regular with small, well-timed electric pulses."), to: "/topics/chaos/uses/control", state: "built" },
    { id: "weather", label: L("Weather"), title: L("Why does the forecast say 70 per cent?"), summary: L("Two almost identical states of the weather soon become completely different. This limits how far ahead the weather can be forecast, and it is why each forecast is now computed many times."), piece: "weather", state: "planned" },
    { id: "populations", label: L("Populations"), title: L("Why do the flies boom and crash for no reason?"), summary: L("A population of animals grows by a fixed factor each year, and its own size holds it back. Under that simple rule, its numbers can swing up and down from year to year with no outside cause."), piece: "populations", state: "planned" },
    { id: "spacecraft", label: L("Spacecraft"), title: L("How did a probe reach the Moon with almost no fuel?"), summary: L("Between the Sun and each planet there are points where the pulls of gravity balance. Some paths reach these points with almost no fuel."), piece: "spacecraft", state: "planned" },
  ],
  complex: [
    { id: "quaternions", label: L("Quaternions"), title: L("Quaternions"), summary: L("Numbers with three imaginary units instead of one. They describe turns in space and steer spacecraft, robots and phones."), to: "/topics/complex/uses/quaternions", state: "built" },
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
    { id: "translation", label: L("Translation"), title: L("Why is a translation written rather than looked up?"), summary: L("Why a machine writes a translation as a new sentence instead of swapping words, and what attention did for it."), piece: "translation", state: "planned" },
    { id: "code", label: L("Code completion"), title: L("What is a program to a model that has only read?"), summary: L("A program as a string of text pieces, and a model that has read a great many programs."), piece: "code", state: "planned" },
    { id: "search", label: L("Search by meaning"), title: L("How can a search find a page that uses none of the words?"), summary: L("Two texts as two points in a space, and the distance between them as a search."), piece: "search", state: "planned" },
    { id: "spam", label: L("Spam"), title: L("How does a mailbox know which mail to throw away?"), summary: L("The oldest job of sorting text by machine, from counting words to weighing every piece of a message."), piece: "spam", state: "planned" },
  ],
  series: [
    { id: "photo", label: L("Sound and pictures"), title: L("How does a photograph fit in a tenth of the space?"), summary: L("A photograph or a song is split into waves. The waves that the eye or the ear would not notice are thrown away, and only the rest is stored."), piece: "photo", state: "planned" },
    { id: "calculator", label: L("Calculators"), title: L("How does a calculator get sin(x)?"), summary: L("A calculator chip can only add, multiply and shift digits. It gets sin(x) from a short sum of powers of x, after first moving x close to 0."), piece: "calculator", state: "planned" },
  ],
  probability: [
    { id: "screening", label: L("Cancer screening"), title: L("How likely is cancer after a positive mammogram?"), summary: L("A breast X-ray finds 9 cancers in 10, yet a positive result means cancer only about once in 10. Counting women instead of using percentages taught doctors to read the result correctly."), piece: "screening", state: "built" },
    { id: "spam", label: L("Spam filters"), title: L("How does a filter weigh one word of an email?"), summary: L("Each word of an email changes the chance that the message is junk mail. A filter makes the same count as for a positive medical test, one word after another."), state: "planned" },
    { id: "calls", label: L("Call centres"), title: L("How many people should answer the phones at nine on a Monday?"), summary: L("Calls arrive at random, at a known average number a minute. The chance of each number of calls in a minute gives the number of staff that keeps the wait short."), state: "planned" },
    { id: "ruin", label: L("Insurance"), title: L("How much money keeps an insurer from going broke?"), summary: L("An insurer takes in premiums and pays out claims, like a gambler who wins and loses bets. The question is the chance of ever running out of money, and why a small edge on each policy matters so much."), state: "planned" },
  ],
};

export function usesOf(slug: string): Use[] {
  return slug in USES ? USES[slug as keyof typeof USES] : [];
}
