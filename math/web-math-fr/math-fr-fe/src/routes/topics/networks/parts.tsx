import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { Offline } from "@/components/Offline";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/networks";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/networks/parts")({
  loader: () => api.topic(TOPIC),
  component: NetParts,
});

/** the flow the clips will follow, from math/docs/story1.md. */
const STEPS = [
  L("Perceptron, the historical and conceptual starting point"),
  L("Neuron, the modern generalisation of the perceptron"),
  L("Fully-connected network, composition of neurons into layers"),
  L("Parameters of the network, weights and biases as tunable values"),
  L("Network as a system of equations, every variable written out explicitly"),
  L("Same network compressed to matrix form"),
  L("Loss function, what gets measured"),
  L("Solving the system, analytic route"),
  L("Solving the system, numerical route motivation"),
  L("Activation function, what keeps the network differentiable end to end"),
  L("Gradient descent"),
  L("Backpropagation"),
  L("Weight initialisation, common schemes and what each preserves"),
  L("Brief survey of other numerical methods"),
  L("Stochastic gradient descent"),
  L("Differential equations in neural networks"),
  L("Derivative, calculus capstone"),
  L("Integral, calculus capstone"),
];

function NetParts() {
  const topic = Route.useLoaderData();
  const made = topic?.part_list.length ?? 0;

  return (
    <div>
      <Heading level={1} className="mt-6">{L("The series, in order")}</Heading>

      {!topic ? (
        <div className="mt-6 max-w-2xl">
          <Offline what={L("The parts of a topic are served by the backend. The flow below is the plan and needs nothing from it.")} />
        </div>
      ) : null}

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {made === 0
          ? L("No clip is made yet. The eighteen steps below are the order they will be built in, and every one of them already has its mathematics on the play pages.")
          : L("{{made}} of {{all}} steps have clips.", { made, all: STEPS.length })}
      </Text>

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("The two closing steps are the capstone: every algorithm before them leans on the word derivative as if it were obvious, and those two make it obvious in retrospect. Topic 4 rests on this one, which is why they sit together in the reading order.")}
      </Text>

      <ol className="mt-10 max-w-3xl space-y-1">
        {STEPS.map((title, i) => {
          const borrowed = i >= 16;
          return (
            <li
              key={title}
              data-text="caption" className="flex gap-3 border-t border-border py-2.5"
            >
              <span className="w-8 shrink-0 text-muted-foreground">{i + 1}</span>
              <span className={borrowed ? "text-secondary" : "text-foreground/80"}>{title}</span>
              {borrowed ? (
                <span data-text="note" className="ml-auto shrink-0">{L("The capstone")}</span>
              ) : (
                <span data-text="note" className="ml-auto shrink-0">{L("Not built")}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
