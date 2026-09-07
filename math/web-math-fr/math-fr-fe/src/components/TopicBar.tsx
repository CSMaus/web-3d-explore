import { Link } from "@tanstack/react-router";
import type { BuiltTopic } from "@/lib/topic";

/**
 * the second level of navigation. the top bar moves between topics, this one
 * moves inside one, so a reader always knows which subject they are in.
 */
export function TopicBar({ topic }: { topic: BuiltTopic }) {
  return (
    <div className="border-b border-edge pb-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link to="/topics" className="font-mono text-[11px] text-muted hover:text-ink">
          topics
        </Link>
        <span className="font-mono text-[11px] text-edge">/</span>
        <span className="font-mono text-sm tracking-wide text-leaf">
          topic {topic.number} - {topic.title}
        </span>
      </div>
      <nav className="mt-3 flex flex-wrap gap-1.5">
        {topic.sections.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-muted"
            activeProps={{ className: "border-leaf text-leaf" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
