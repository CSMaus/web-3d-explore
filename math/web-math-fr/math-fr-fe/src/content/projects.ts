import { L } from "@/lib/lang";
import TOPICS from "@/content/snapshot/topics.json";
import FRACTALS from "@/content/snapshot/fractals.json";
import ALICE from "@/content/projects/alice-map.json";

/**
 * the projects page, one entry a project. a project is shown, not described: a moving figure on
 * its card, a figure to try at the top of its page, then the few steps of how it works, each
 * with its own figure and a sentence or two. the figures are in components/projects, by slug and
 * by step. the numbers in `facts` are read from the data where the data is in this repository.
 */
export type Step = {
  /** the name of the step's figure in components/projects */
  figure: string;
  title: string;
  text: string;
};

export type Project = {
  slug: string;
  title: string;
  summary: string;
  /** what to do with the figure at the top of the page, and what it shows */
  hero: string;
  facts: { value: string; label: string }[];
  steps: Step[];
  /** a closing sentence for what the steps leave out */
  more?: string;
  /** what it is built with */
  stack: string[];
  /** where it can be seen or read, if anywhere */
  link?: { label: string; to: string };
};

const topics = TOPICS as { aside: boolean }[];
const series = FRACTALS as { parts: number; beats: number; seconds: number };
const ALICE_META = ALICE.meta;
const passages = ALICE_META.sizes.reduce((a, s) => a + s.passages, 0);

export const PROJECTS: Project[] = [
  {
    slug: "maths-site",
    title: L("Mathematics, made visible"),
    summary: L("This site: fractals, chaos, neural networks and language models as short clips, pages to move by hand, and the equations behind them."),
    hero: L("Drag the point across the map of the Mandelbrot set. Every pixel of the picture is computed again in the browser for that value of c."),
    facts: [
      { value: String(topics.filter((t) => !t.aside).length), label: L("topics") },
      { value: String(series.parts), label: L("parts in the first series") },
      { value: "4", label: L("languages") },
      { value: String(topics.filter((t) => t.aside).length), label: L("aside") },
    ],
    steps: [
      { figure: "watch", title: L("Watch"), text: L("Each topic opens with a series of short clips. Every number in a clip is computed by the code that draws it.") },
      { figure: "move", title: L("Move it by hand"), text: L("Every system in the clips has a page where its numbers are sliders. The picture is computed again on every change.") },
      { figure: "read", title: L("Read the numbers"), text: L("The equations sit beside the pictures. Each value a page prints comes from the same tested code that the checks run on every change.") },
      { figure: "zoom", title: L("Zoom past the graphics card"), text: L("Deep zoom into the Mandelbrot set needs more precision than a graphics card has. A server computes it in double precision and sends it coarse first, then finer.") },
    ],
    more: L("The site also runs on its own from a snapshot of its content, which is how it is published as static pages."),
    stack: ["React", "TypeScript", "WebGL", "Python", "FastAPI", "NumPy", "PostgreSQL", "Manim"],
    link: { label: L("Open the topics"), to: "/topics" },
  },
  {
    slug: "fractals-series",
    title: L("The fractals series"),
    summary: L("A video series in eleven parts: how to measure a shape that is rough at every scale, and the few rules that draw every shape in it."),
    hero: L("Each step replaces every piece of the curve by four pieces a third as long. The length grows by a third at every step and never settles. The number that stays the same is the dimension, log 4 / log 3."),
    facts: [
      { value: String(series.parts), label: L("parts") },
      { value: String(series.beats), label: L("scenes") },
      { value: String(Math.round(series.seconds / 60)), label: L("minutes") },
      { value: (Math.log(4) / Math.log(3)).toFixed(2), label: L("the dimension of the Koch curve") },
    ],
    steps: [
      { figure: "coast", title: L("How long is a coast?"), text: L("Walked with a shorter ruler, a rough coast comes out longer, and the length never settles. The first four parts start here.") },
      { figure: "boxes", title: L("Count boxes instead"), text: L("Cover the shape with boxes and count them as the boxes shrink. On logarithms the counts rise along a slope that comes down towards the dimension, 1.26 for the Koch curve.") },
      { figure: "fern", title: L("Four rules draw a fern"), text: L("Each point is moved by one of four rules picked at random. The fern appears after a few thousand points.") },
      { figure: "escape", title: L("Which points stay?"), text: L("Square a number and add c, again and again. The values of c whose path stays near zero form the Mandelbrot set.") },
    ],
    stack: ["Manim", "Python", "NumPy"],
    link: { label: L("The series"), to: "/topics/fractals/parts" },
  },
  {
    slug: "webpaut",
    title: L("WebPAUT, ultrasonic inspection in the browser"),
    summary: L("A web platform for ultrasonic inspection of welds and parts: open a scan file in the browser, see every view of it, find and size the flaws, and produce the report."),
    hero: L("A simulated inspection. Drag the probe along the plate: the fan shows the echoes inside the steel, the trace shows the beam pointing straight down, and the lower plot keeps the strongest echo at every position. The flaw is found with a threshold set from the noise of a clean stretch, and sized where its echo falls to half its peak, the rules WebPAUT uses."),
    facts: [
      { value: "5", label: L("views of a scan: A, B, C, D and sector") },
      { value: ".nde", label: L("the open file format it reads") },
      { value: "3", label: L("kinds of data: ultrasound, eddy current, radiography") },
      { value: "2026", label: L("built from scratch") },
    ],
    steps: [
      { figure: "pulse", title: L("Sound in, echo back"), text: L("A probe sends a short pulse of ultrasound into the part. A flaw sends part of it back early, and the far wall sends the rest back later.") },
      { figure: "bscan", title: L("Echoes side by side make a picture"), text: L("The probe moves along the part. Each position adds one column of echoes, and the columns together show the inside.") },
      { figure: "stream", title: L("Only what is on screen travels"), text: L("Scan files are large. The whole file stays on the server, which computes the views for the pixels on screen and sends them over one websocket, so zoom and pan stay live.") },
      { figure: "report", title: L("Found, sized, reported"), text: L("A statistical detector sets its threshold from the noise around the flaw. Each flaw is sized by how its echo falls off, kept in a database, and written into PDF and Excel reports.") },
    ],
    more: L("A dashboard sums up the inspections, assistants built on a language model answer questions over the data, and a physics-based simulator generates scans for testing."),
    stack: ["Python", "FastAPI", "React", "WebGL", "WebSocket"],
  },
  {
    slug: "alice-in-wonderland",
    title: L("Alice in Wonderland, a language model that knows one book"),
    summary: L("An experiment towards a small language model that answers only from inside Lewis Carroll's Wonderland. The training data is written from the book by larger models, for TinyLlama to learn from."),
    hero: L("Each point is one passage of the book, 300 tokens long, placed by its embedding: passages about the same things sit close together. Pick an instruction from the dataset to light the passages that mention it, or click a point to read its passage and its five closest in meaning."),
    facts: [
      { value: String(ALICE_META.sizes.length), label: L("passage sizes") },
      { value: String(passages), label: L("passages embedded") },
      { value: ALICE_META.pairs.toLocaleString("en"), label: L("instruction and answer pairs") },
      { value: L("Not yet"), label: L("TinyLlama trained") },
    ],
    steps: [
      { figure: "cut", title: L("The book, cut four ways"), text: L("The book is cut into overlapping passages of four sizes, from 150 to 900 tokens. Each passage becomes an embedding: a list of numbers that places it by meaning.") },
      { figure: "pick", title: L("The closest passages"), text: L("For each instruction, the three closest passages of each size are found, together with the passages around them in the book.") },
      { figure: "write", title: L("An answer from inside the book"), text: L("GPT-4o models write the answer from those passages only, in the book's voice. When the book has nothing on the subject, the answer says it does not know.") },
      { figure: "train", title: L("The data, and the next step"), text: L("The pairs come from questions written from the book and from the general instructions of the Cleaned Alpaca dataset. Training TinyLlama on them is the next step; it has not been run.") },
    ],
    stack: ["Python", "OpenAI API", "NumPy", "TinyLlama"],
    link: { label: L("The repository"), to: "https://github.com/CSMaus/Alice-in-Wonderland" },
  },
];

/** a draft written before the project pages showed figures; kept as text until it is shown */
export type Draft = { slug: string; title: string; summary: string; body: string[] };

/**
 * written but not shown: the owner has not decided whether these go on the public page. a
 * project moves into PROJECTS above, with its figures, to appear.
 */
export const DRAFTS: Draft[] = [
  {
    slug: "metamaterial-calculator",
    title: "A calculator for sound insulation",
    summary: "A desktop prototype that computes how much sound a stack of insulating layers absorbs and lets through, from a database of materials, with a chat assistant over that database.",
    body: [
      "Each layer is a foam, a solid sheet or a stiff panel. The absorption and the transmission loss of the whole stack come from a transfer-matrix model of sound in porous and elastic layers, ported to numpy.",
      "A PostgreSQL database holds the materials. An agent built on a language model answers questions over it, and turns a written description of a material into a database entry.",
      "The prototype stopped before the calculation was wired to the layer editor.",
    ],
  },
];

export function projectAt(slug: string): Project | null {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}
