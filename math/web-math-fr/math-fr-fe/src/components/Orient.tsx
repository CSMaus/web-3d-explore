import { Heading } from "@kit/index";

/**
 * the four things a reader needs before a single control means anything: what
 * goes in, what the picture is, what moving things does, and what the result
 * says. it sits first on every play page, in the same place, so the reader
 * learns where to look once.
 *
 * this exists because the pages without it were legible only to someone who
 * already knew what they were looking at.
 */
export type OrientText = {
  input: string;
  picture: string;
  move: string;
  means: string;
};

const ROWS: [keyof OrientText, string][] = [
  ["input", "What goes in"],
  ["picture", "What is on screen"],
  ["move", "What to move"],
  ["means", "What it says"],
];

export function Orient({ text }: { text: OrientText }) {
  return (
    <section className="rounded border border-secondary/30 bg-secondary/[0.03] p-4">
      <Heading level={2}>START HERE</Heading>
      <dl className="mt-3 space-y-2.5">
        {ROWS.map(([key, label]) => (
          <div key={key}>
            <dt data-text="label">{label}</dt>
            <dd data-text="body" className="mt-0.5">{text[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
