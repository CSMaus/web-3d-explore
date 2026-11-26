import { createFileRoute } from "@tanstack/react-router";
import { Heading, Text } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/probability/parts")({
  component: ProbabilityParts,
});

/** the planned clips, one a step of the topic, each opening on its question */
const STEPS = [
  { question: L("When two dice are thrown, why does a sum of 7 come up six times as often as a sum of 2?"), plan: L("The 36 ways two dice can land, shown as a grid. A sum is a set of cells, and throws fill a bar chart that settles on the counts of cells. Then 23 people in a room, and a shared birthday with a chance of 50.7 per cent.") },
  { question: L("After a positive test result, how likely is the disease?"), plan: L("100,000 people are counted instead of using a formula. 99 ill people test positive against 4,995 healthy ones, so only 1.94 per cent of the positives are ill. Bayes' rule writes the same count as a formula. Then a game with three doors and a host who knows where the car is.") },
  { question: L("A round costs 2, and a six on a die wins 10. How much has a player won or lost after 1000 rounds?"), plan: L("The expected gain of a game is each result times its chance, added up: -1/3 a round. Averages add even for parts that depend on each other, shown with hats handed back at random.") },
  { question: L("A call centre gets three calls a minute on average. How often does a minute pass with no call?"), plan: L("Balls that go right or left at each pin of a board, counted in bins. Many unlikely events, whose counts come close to the Poisson chances. The constant e appears in the chance of no call, e^-3 = 0.0498.") },
  { question: L("Taxis come at random, 10 minutes apart on average. How often is the wait over 20 minutes?"), plan: L("Narrower and narrower time bins turn a bar chart of waits into a curve, and a chance becomes an area under it: e^-2 = 0.135. Then a wait that does not depend on how long it has already lasted.") },
  { question: L("A gambler starts with 10 and bets 1 at a time on a coin. How often is 20 reached before 0?"), plan: L("Walks of coin tosses spread like the square root of the number of tosses and stay on one side for a long time. The chance of reaching 20 is found by symmetry, and a coin that wins 49 times in 100 cuts it from 1/2 to 0.40.") },
];

function ProbabilityParts() {
  return (
    <div>
      <Heading level={1} className="mt-6">{L("Planned videos, in order")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("No video of this topic is made yet. The list gives the six planned videos in the order they will be made. Each video answers one question, and each already has two pages under Play.")}
      </Text>
      <ol className="mt-8 max-w-2xl space-y-2">
        {STEPS.map((step, i) => (
          <li key={step.question} className="flex items-baseline gap-3 rounded border border-border px-4 py-2.5">
            <span data-text="caption" className="w-6 shrink-0">{i + 1}</span>
            <span className="min-w-0">
              <span data-text="body" className="block">{step.question}</span>
              <span data-text="note" className="mt-1 block">{step.plan}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
