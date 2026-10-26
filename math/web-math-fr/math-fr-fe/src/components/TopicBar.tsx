import { Link } from "@tanstack/react-router";
import { TabLink } from "@/components/TabLink";
import type { BuiltTopic } from "@/lib/topic";
import { L } from "@/lib/lang";

/**
 * the second level of navigation. the top bar moves between topics, this one
 * moves inside one, so a reader always knows which subject they are in.
 */
export function TopicBar({ topic }: { topic: BuiltTopic }) {
  return (
    <div className="border-b border-border pb-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link to="/topics" data-text="crumb">
          {L("Topics")}
        </Link>
        <span data-text="crumb">/</span>
        <span data-text="topic">
          {topic.number === 0 ? L("Start here") : L("Topic {{n}}", { n: topic.number })} - {topic.title}
        </span>
      </div>
      <nav className="mt-3 flex flex-wrap gap-1.5" aria-label={L("Sections of the topic")}>
        {topic.sections.map((item) => (
          <TabLink key={item.to} to={item.to}>
            {item.label}
          </TabLink>
        ))}
      </nav>
    </div>
  );
}
