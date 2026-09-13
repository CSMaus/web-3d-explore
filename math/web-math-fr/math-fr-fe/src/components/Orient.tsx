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
  ["picture", "What you are looking at"],
  ["move", "What to move"],
  ["means", "What it tells you"],
];

export function Orient({ text }: { text: OrientText }) {
  return (
    <section className="rounded border border-sky/30 bg-sky/[0.03] p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">START HERE</h2>
      <dl className="mt-3 space-y-2.5">
        {ROWS.map(([key, label]) => (
          <div key={key}>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</dt>
            <dd className="mt-0.5 text-[12px] leading-relaxed text-ink/80">{text[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
