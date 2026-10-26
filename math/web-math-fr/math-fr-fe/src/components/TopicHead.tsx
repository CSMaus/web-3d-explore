import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Label, SolidFigure } from "@kit/index";
import { SHAPES, topicLabel } from "@/lib/shapes";
import type { BuiltTopic } from "@/lib/topic";

/**
 * the head of a topic's own pages, the way Learn, Topics and Play are headed: the
 * topic's place in the order, its name in the display style, its one line, and its
 * turning figure at the right, faster under the pointer. the page's own heading
 * follows it, so the name here is not a heading.
 */
export function TopicHead({ topic }: { topic: BuiltTopic }) {
  const { t } = useTranslation();
  const [lit, setLit] = useState(false);
  const shape = SHAPES[topic.slug];
  const line = t(`front.lines.${topic.slug}`, { defaultValue: "" });
  return (
    <section data-slot="hero" data-size="page" className="mb-2" onMouseEnter={() => setLit(true)} onMouseLeave={() => setLit(false)}>
      {shape ? (
        <div data-slot="hero-picture">
          <SolidFigure kind={shape} lit={lit} className="h-full w-full" />
        </div>
      ) : null}
      <div data-slot="hero-text">
        <div data-slot="hero-eyebrow">
          <Label as="div">{topicLabel(topic.number, t)}</Label>
        </div>
        <p data-slot="display">{topic.title}</p>
        {line ? <p data-slot="lede">{line}</p> : null}
      </div>
    </section>
  );
}
