import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { api } from "@/lib/api";
import { L } from "@/lib/lang";
import { GROUPS, SYSTEMS, TOPIC, routeOf, type ProbabilityRoute } from "@/lib/probability";
import { PlayTile } from "@/components/PlayTile";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/topics/probability/play/")({
  loader: () => api.theory(TOPIC),
  component: ProbabilityIndex,
});

/** the same names and summaries the backend serves, so the page stands alone. */
export const LOCAL: { id: string; name: string; summary: string }[] = [
  { id: "dice", name: L("Two dice: why 7 comes up six times as often as 2"), summary: L("Two dice can land in 36 equally likely ways, and six of them give a sum of 7, against one for a sum of 2. Thousands of throws show the share of 7 settling on 6/36.") },
  { id: "birthdays", name: L("Shared birthdays"), summary: L("How many people must be in a room for an even chance that two share a birthday? First a guess, then the curve: 23 people give a chance of 50.7 per cent.") },
  { id: "test", name: L("A positive test"), summary: L("A test finds 99 per cent of ill people and wrongly calls 5 per cent of healthy people ill. One person in 1000 is ill. Counting 100,000 people shows that only 1.94 per cent of the positive results belong to ill people.") },
  { id: "doors", name: L("Three doors: stay or switch"), summary: L("A car is behind one of three doors. After the player picks, the host opens another door with a goat behind it. A thousand games with each choice show whether switching helps, and then the same with 100 doors.") },
  { id: "game", name: L("A game with a die: pay 2, win 10 on a six"), summary: L("A round costs 2, and a six on a die wins 10. On average a round loses 1/3. Over a thousand rounds the average per round settles on -1/3, while the total drifts down by about 333.") },
  { id: "hats", name: L("Hats handed back at random"), summary: L("Hats are handed back to their owners in a random order. On average exactly 1 person gets their own hat back, with 3 hats and with 100.") },
  { id: "galton", name: L("The Galton board"), summary: L("Balls fall through rows of pins and go right or left at each pin. The bins below fill to a shape that a count of paths predicts. Tilting the board changes the chance of going right.") },
  { id: "poisson", name: L("Rare events: a minute with no call"), summary: L("A call centre gets 3 calls a minute on average, at random. Cutting the minute into finer and finer slices gives the chance of a minute with no call: e^-3 = 0.0498.") },
  { id: "bins", name: L("From bars to a curve: waits for a taxi"), summary: L("10,000 waits for a taxi, 10 minutes on average, are counted in narrower and narrower time bins until the bars become a curve. The chance of waiting over 20 minutes is the area under the curve: e^-2 = 0.135.") },
  { id: "memory", name: L("Waiting that forgets the past"), summary: L("Taxis come at random. After 10 minutes of waiting, the wait still ahead is as long on average as at the start. A bus on a timetable behaves differently.") },
  { id: "walks", name: L("Fifty walks of coin tosses"), summary: L("A counter moves up one step for each head and down one for each tail. The walks spread like the square root of the number of tosses, and most of them spend nearly all or nearly none of their time above zero.") },
  { id: "ruin", name: L("Gambler's ruin"), summary: L("A gambler starts with 10 and bets 1 at a time until reaching 20 or 0. With a fair coin, 20 is reached half the time, after 100 bets on average. A coin that wins 49 times in 100 reaches 20 only 0.40 of the time.") },
];

function ProbabilityIndex() {
  const theory = Route.useLoaderData();
  const items = theory?.systems.length ? theory.systems : LOCAL;
  const byId = new Map(items.map((s) => [s.id, s]));
  return (
    <>
      <Heading level={1} className="mt-4">{L("Twelve pages in six groups")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("Twelve questions about chance. Each has an exact answer, and each can be checked by hand.")}
      </Text>
      {!theory ? (
        <Text kind="note" as="p" className="mt-3">{L("The page descriptions come from the site's server, which is not answering. The pages themselves work without it.")}</Text>
      ) : null}
      {GROUPS.map((group, g) => (
        <section key={group} className="mt-10">
          <Heading level={2}>{group}</Heading>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {SYSTEMS.filter((p) => p.group === group).map((p) => {
              const s = byId.get(p.id);
              const number = SYSTEMS.findIndex((q) => q.id === p.id) + 1;
              return <Tile key={p.id} to={routeOf(p.id)} number={number} name={s?.name ?? p.label} summary={s?.summary ?? ""} delay={g * 60} />;
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function Tile({ to, number, name, summary, delay }: { to: ProbabilityRoute; number: number; name: string; summary: string; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise h-full">
      <PlayTile to={to} number={number} label={name} summary={summary} />
    </div>
  );
}
