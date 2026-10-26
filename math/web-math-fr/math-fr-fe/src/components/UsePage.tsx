import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { TextLink, Text, Heading, Label, Panel } from "@kit/index";
import type { Piece } from "@/content/uses/kinds";
import type { BuiltTopic } from "@/lib/topic";
import { L } from "@/lib/lang";

/**
 * an application piece laid out for reading: the question, the lede, the
 * sections in order with their figures where the text calls for them, then
 * what the piece does not claim and the sources every fact rests on.
 */
export function UsePage({ topic, piece, figures = {} }: { topic: BuiltTopic; piece: Piece; figures?: Record<string, ReactNode> }) {
  const slug = topic.slug as Piece["topic"];
  return (
    <div>
      <article className="mt-8">
        <Heading>{piece.question}</Heading>
        <Text kind="intro" as="p" className="mt-3 max-w-2xl">{piece.lede}</Text>
        {piece.sections.map((s) => (
          <section key={s.heading} className="mt-12">
            <Heading level={2}>{s.heading}</Heading>
            <div className="mt-4 max-w-2xl space-y-4">
              {s.paragraphs.map((p, i) => (
                <Text kind="body" as="p" key={i}>{p}</Text>
              ))}
            </div>
            {s.figure && figures[s.figure] ? <div className="mt-6">{figures[s.figure]}</div> : null}
          </section>
        ))}
        <section className="mt-12 max-w-2xl">
          <Label>{L("What this does not say")}</Label>
          <ul data-text="body" className="mt-3 list-disc space-y-2 pl-5">
            {piece.limits.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </section>
        <Panel label={L("Sources")} tone="muted" className="mt-12 max-w-2xl">
          <ol data-text="caption" className="list-decimal space-y-1.5 pl-5">
            {piece.sources.map((s) => (
              <li key={s.url}>
                <a data-slot="link" href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="mt-10">
          <TextLink asChild>
            <Link to={`/topics/${slug}/uses` as "/topics/fractals/uses"}>← {L("All applications of this topic")}</Link>
          </TextLink>
        </div>
      </article>
    </div>
  );
}
