import type { Meta, StoryObj } from "@storybook/react-vite";
import { theme } from "../../config/index.ts";
import { TEXT_SLOTS, type TextStyle } from "../../config/kinds.ts";
import { Heading, Text } from "../components/pieces";

const meta: Meta = {
  title: "Foundations/Text",
  parameters: {
    docs: {
      description: {
        component:
          "Every kind of text in the app, read from `config/text.ts`: one entry per kind with its font, size, weight, leading, tracking, case, colour and an optional background, and a line saying where it is used. The fonts themselves are in `config/type.ts`. A new entry is a new style, reached in a page with `<Text kind=\"name\">`.",
      },
    },
  },
};
export default meta;

const SAMPLE = "Count the boxes the edge passes through";

/** the attributes that put a sample into the named style, the way the real element carries it. */
function sampleProps(name: string): Record<string, string> {
  if (name.startsWith("heading")) return { "data-slot": "heading", "data-level": name.slice(7) };
  if (name === "body") return {};
  const slot: Record<string, string> = { brand: "topbar-brand", nav: "topbar-link", search: "search-button", panelHead: "panel-head", field: "field-name", fieldValue: "field-value" };
  if ((TEXT_SLOTS as readonly string[]).includes(name)) return { "data-slot": slot[name] ?? name };
  return { "data-text": name };
}

function spec(s: TextStyle): string {
  const extras = [s.background && s.background !== "transparent" ? `on ${s.background}` : "", s.padding ? `padding ${s.padding[0]}/${s.padding[1]}` : ""].filter(Boolean);
  return [s.font, `${s.size}px`, `weight ${s.weight}`, `leading ${s.leading}`, `${s.tracking}em`, s.case, s.colour, ...extras].join(" · ");
}

function Row({ name, style }: { name: string; style: TextStyle }) {
  const sample =
    name === "readoutValue" ? (
      <dl data-slot="readout" style={{ display: "block" }}>
        <dd style={{ textAlign: "left" }}>{SAMPLE}</dd>
      </dl>
    ) : (
      <span {...sampleProps(name)} style={{ position: "static", visibility: "visible", display: "inline-block" }}>
        {SAMPLE}
      </span>
    );
  return (
    <div className="grid gap-2 border-t border-border py-4 lg:grid-cols-[180px_minmax(0,1fr)]">
      <div>
        <div className="font-mono text-[12px] text-foreground">{name}</div>
        <div className="font-mono text-[11px] leading-relaxed text-muted-foreground">{style.used}</div>
      </div>
      <div className="space-y-2">
        <div>{sample}</div>
        <div className="font-mono text-[11px] text-muted-foreground">{spec(style)}</div>
      </div>
    </div>
  );
}

export const EveryStyle: StoryObj = {
  name: "Every style",
  parameters: { docs: { description: { story: "One row per entry in `config/text.ts`: the name, where it is used, a sample set in that style, and the values behind it." } } },
  render: () => (
    <div>
      {Object.entries(theme.text.styles).map(([k, s]) => (
        <Row key={k} name={k} style={s} />
      ))}
    </div>
  ),
};

export const Headings: StoryObj = {
  parameters: { docs: { description: { story: "The three heading levels (`heading1`, `heading2`, `heading3` in `config/text.ts`) over running text, with the heading mark from `config/type.ts`." } } },
  render: () => (
    <div className="max-w-2xl space-y-4">
      <Heading level={1}>{SAMPLE}</Heading>
      <p>Running text under a first-level heading, at the body style.</p>
      <Heading level={2}>{SAMPLE}</Heading>
      <p>Running text under a second-level heading.</p>
      <Heading level={3}>{SAMPLE}</Heading>
      <p>Running text under a third-level heading.</p>
    </div>
  ),
};

export const AddedStyle: StoryObj = {
  name: "An added style",
  parameters: { docs: { description: { story: "The `note` entry is the worked example of a style no element uses: it exists only in the config and is reached with the `Text` element. Copy its entry to add another." } } },
  render: () => (
    <div className="max-w-2xl">
      <p>
        Running text with <Text kind="note">a note set in the added style</Text> inside it, and the same note as a block:
      </p>
      <Text kind="note" as="div" className="mt-3">
        {SAMPLE}
      </Text>
    </div>
  ),
};
