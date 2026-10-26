import type { ReactNode } from "react";
import { Text, Heading, Panel, Verdict as KitVerdict } from "@kit/index";

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
      <Heading className="mt-4">{title}</Heading>
      <Text kind="body" as="p" className="mt-2 max-w-2xl">{job}</Text>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Panel label="WHAT GOES IN">{input}</Panel>
          <Panel label="RUN" tone="primary">{run}</Panel>
          {more}
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          {picture}
          <Panel label="WHAT CAME OUT">{result}</Panel>
          {below}
        </div>
      </div>
    </>
  );
}

/** the first line of a result: the outcome in one sentence, large enough to read across the room. */
export function Verdict({ children, good }: { children: ReactNode; good?: boolean }) {
  return <KitVerdict good={good}>{children}</KitVerdict>;
}
