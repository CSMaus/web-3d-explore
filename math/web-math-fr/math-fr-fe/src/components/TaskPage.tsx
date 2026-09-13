import type { ReactNode } from "react";

/**
 * the shape every play page in an applied topic has, in the same places every
 * time: what goes in on the left, then run, then what came out beside the
 * picture. a reader learns where to look once.
 *
 * `result` comes first in the right column and is the visible outcome of the
 * job, in words a person can check against the picture. the measured numbers
 * follow it, never lead it.
 */
type Props = {
  title: string;
  job: string;
  input: ReactNode;
  run: ReactNode;
  picture: ReactNode;
  result: ReactNode;
  more?: ReactNode;
  below?: ReactNode;
};

export function TaskPage({ title, job, input, run, picture, result, more, below }: Props) {
  return (
    <>
      <h1 className="mt-4 font-mono text-sm tracking-wide text-leaf">{title}</h1>
      <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink/80">{job}</p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">WHAT GOES IN</h2>
            <div className="mt-3">{input}</div>
          </section>
          <section className="rounded border border-leaf/40 p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-leaf">RUN</h2>
            <div className="mt-3">{run}</div>
          </section>
          {more}
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          {picture}
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">WHAT CAME OUT</h2>
            <div className="mt-3">{result}</div>
          </section>
          {below}
        </div>
      </div>
    </>
  );
}

/** the first line of a result: the outcome in one sentence, large enough to read across the room. */
export function Verdict({ children, good }: { children: ReactNode; good?: boolean }) {
  return (
    <p
      className={
        good === undefined
          ? "text-[13px] leading-relaxed text-ink"
          : good
            ? "text-[13px] leading-relaxed text-leaf"
            : "text-[13px] leading-relaxed text-warn"
      }
    >
      {children}
    </p>
  );
}
