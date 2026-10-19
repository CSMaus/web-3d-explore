/**
 * the projects page, one entry a project. the owner writes these; the site
 * only lays them out. a project's page is /projects/<slug>.
 */
export type Project = {
  slug: string;
  title: string;
  summary: string;
  /** paragraphs, in order */
  body: string[];
  /** where it can be seen or read, if anywhere */
  link?: { label: string; to: string };
};

export const PROJECTS: Project[] = [
  {
    slug: "maths-site",
    title: "Mathematics, made visible",
    summary: "This site: the mathematics of fractals, chaos, networks and language models as clips, interactive pages and the equations behind them.",
    body: [
      "One place to read the mathematics, watch the series that explains it, and move every system in it. Nothing on the site shows a shape without the mathematics that makes it, and nothing states a number that was not computed on the page.",
      "Five topics so far, from imaginary numbers to tokens, each with its series, its interactive pages and its equations.",
    ],
    link: { label: "The topics", to: "/topics" },
  },
  {
    slug: "fractals-series",
    title: "The fractals series",
    summary: "A video series on fractals: a dimension that is not a whole number, and the handful of rules that produce every shape in it.",
    body: [
      "Eleven topics, from measuring the coast of Britain to the Mandelbrot set, every number in every clip computed by the code that draws the picture.",
      "The series is made with an animation library; the interactive pages on this site are where the same systems can be moved by hand.",
    ],
    link: { label: "The series", to: "/topics/fractals/parts" },
  },
  {
    slug: "ui-kit",
    title: "A ui kit set from code",
    summary: "The component library this site is built on, whose whole look is set in a folder of typed scripts and reused across projects.",
    body: [
      "Buttons, panels, tabs, sliders, the top bar and the type are configured in one folder of scripts, and one generated stylesheet carries the result. A project brings its own folder and the same components.",
    ],
  },
];

export function projectAt(slug: string): Project | null {
  return PROJECTS.find((p) => p.slug === slug) ?? null;
}
