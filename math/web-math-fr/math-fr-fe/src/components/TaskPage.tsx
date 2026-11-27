import type { JSX, ReactNode } from "react";
import { Button, Text, Heading, Panel, Verdict as KitVerdict } from "@kit/index";
import { L } from "@/lib/lang";

const LAB = "lab";
const REDUCED = "(prefers-reduced-motion: reduce)";

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
  story?: ReactNode;
};

/**
 * the two columns of a play page: what goes in on the left, the picture and what came out on the
 * right, held in view on a wide screen. on a narrow screen the picture comes first (styles.css,
 * task-in and task-out). every play page lays itself out with this, through TaskPage or directly.
 */
export function PlayColumns({ input, output }: { input: ReactNode; output: ReactNode }) {
  return (
    <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* min-w-0 on both columns: a long row inside never widens the column past the screen */}
      <div data-slot="task-in" className="min-w-0 space-y-4">
        {input}
      </div>
      <div data-slot="task-out" className="min-w-0 space-y-3 lg:sticky lg:top-24 lg:self-start">
        {output}
      </div>
    </div>
  );
}

export function ToLab(): JSX.Element {
  const go = () => {
    const lab = document.getElementById(LAB);
    if (!lab) return;
    const reduced = window.matchMedia?.(REDUCED)?.matches ?? false;
    if (typeof lab.scrollIntoView === "function") {
      lab.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
    lab.focus({ preventScroll: true });
  };
  return (
    <Button variant="outline" onClick={go}>
      {L("Go to the experiment")}
    </Button>
  );
}

export function TaskPage({ title, job, input, run, picture, result, more, below, story }: Props) {
  return (
    <>
      <Heading className="mt-4">{title}</Heading>
      <Text kind="body" as="p" data-slot="task-job" className="mt-2 max-w-2xl">{job}</Text>
      {story ? (
        <>
          <div className="mt-4">{story}</div>
          <Heading level={2} id={LAB} tabIndex={-1} className="mt-10 scroll-mt-24">
            {L("The experiment")}
          </Heading>
        </>
      ) : null}

      <PlayColumns
        input={
          <>
            <Panel label={L("WHAT GOES IN")}>{input}</Panel>
            <Panel label={L("RUN")} tone="primary">{run}</Panel>
            {more}
          </>
        }
        output={
          <>
            {picture}
            <Panel label={L("WHAT CAME OUT")}>{result}</Panel>
            {below}
          </>
        }
      />
    </>
  );
}

/** the first line of a result: the outcome in one sentence, large enough to read across the room. */
export function Verdict({ children, good }: { children: ReactNode; good?: boolean }) {
  return <KitVerdict good={good}>{children}</KitVerdict>;
}
