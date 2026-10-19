import { Link } from "@tanstack/react-router";
import { Text, Badge, Button, Heading, Panel } from "@kit/index";
import type { BuiltTopic } from "@/lib/topic";
import { usesOf, type PieceRoute } from "@/lib/uses";

/**
 * a topic's applications: the thing in the world first, and the topic's idea
 * entering as the explanation of one part of it. built ones open; planned ones
 * say what is coming.
 */
export function UsesIndex({ topic }: { topic: BuiltTopic }) {
  const slug = topic.slug as "fractals" | "chaos" | "complex" | "networks" | "tokens";
  const uses = usesOf(slug);
  const pieceRoute = `/topics/${slug}/uses/$piece` as PieceRoute;
  return (
    <div>
      <Heading className="mt-6">Applications</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        Where the ideas of this topic are used. Each application is the thing in the world first, then the one
        part of it the mathematics enters, in detail and in plain words.
      </Text>
      <ol className="mt-8 grid gap-4 md:grid-cols-2">
        {uses.map((u) => (
          <li key={u.id}>
            <Panel className="h-full">
              <div className="flex items-start justify-between gap-3">
                <div data-text="itemTitle">{u.title}</div>
                <Badge variant="outline">{u.state === "built" || u.piece ? "Ready" : "Being written"}</Badge>
              </div>
              <Text kind="intro" as="p" className="mt-2">{u.summary}</Text>
              {u.to ? (
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link to={u.to}>Open</Link>
                  </Button>
                </div>
              ) : u.piece ? (
                <div className="mt-4">
                  <Button variant="outline" asChild>
                    <Link to={pieceRoute} params={{ piece: u.piece }}>Read</Link>
                  </Button>
                </div>
              ) : null}
            </Panel>
          </li>
        ))}
      </ol>
    </div>
  );
}
