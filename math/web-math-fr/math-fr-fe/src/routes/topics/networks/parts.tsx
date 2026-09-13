import { createFileRoute } from "@tanstack/react-router";
import { Offline } from "@/components/Offline";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { NETWORKS, TOPIC } from "@/lib/networks";

export const Route = createFileRoute("/topics/networks/parts")({
  loader: () => api.topic(TOPIC),
  component: NetParts,
});

/** the flow the clips will follow, from math/docs/story1.md. */
const STEPS = [
  "Perceptron, the historical and conceptual starting point",
  "Neuron, the modern generalisation of the perceptron",
  "Fully-connected network, composition of neurons into layers",
  "Parameters of the network, weights and biases as tunable values",
  "Weight initialisation, common schemes and what each preserves",
  "Network as a system of equations, every variable written out explicitly",
  "Same network compressed to matrix form",
  "Solving the system, analytic route",
  "Solving the system, numerical route motivation",
  "Loss function, what gets measured",
  "Activation function, what keeps the network differentiable end to end",
  "Gradient descent",
  "Backpropagation",
  "Brief survey of other numerical methods",
  "Stochastic gradient descent",
  "Differential equations in neural networks",
  "Derivative, calculus capstone",
  "Integral, calculus capstone",
];

function NetParts() {
  const topic = Route.useLoaderData();
  const made = topic?.part_list.length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <TopicBar topic={NETWORKS} />
      <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">The series, in order</h1>

      {!topic ? (
        <div className="mt-6 max-w-2xl">
          <Offline what="The parts of a topic are served by the backend. The flow below is the plan and needs nothing from it." />
        </div>
      ) : null}

      <p className="mt-3 max-w-2xl text-sm text-muted">
        {made === 0
          ? "No clip is made yet. The eighteen steps below are the order they will be built in, and every one of them already has its mathematics on the play pages."
          : `${made} of ${STEPS.length} steps have clips.`}
      </p>

      <p className="mt-3 max-w-2xl text-sm text-muted">
        The two closing steps are the capstone: every algorithm before them leans on the word
        derivative as if it were obvious, and those two make it obvious in retrospect. Topic 4
        rests on this one, which is why they sit together in the reading order.
      </p>

      <ol className="mt-10 max-w-3xl space-y-1">
        {STEPS.map((title, i) => {
          const borrowed = i >= 16;
          return (
            <li
              key={title}
              className="flex gap-3 border-t border-edge py-2.5 font-mono text-[12px]"
            >
              <span className="w-8 shrink-0 text-muted">{i + 1}</span>
              <span className={borrowed ? "text-sky" : "text-ink/80"}>{title}</span>
              {borrowed ? (
                <span className="ml-auto shrink-0 text-[10px] text-muted">The capstone</span>
              ) : (
                <span className="ml-auto shrink-0 text-[10px] text-muted">Not built</span>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
