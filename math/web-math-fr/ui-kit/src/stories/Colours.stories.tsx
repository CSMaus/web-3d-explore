import type { Meta, StoryObj } from "@storybook/react-vite";
import { theme } from "../../config/index.ts";
import type { Palette } from "../../config/kinds.ts";

const meta: Meta = {
  title: "Foundations/Colours",
  parameters: {
    docs: {
      description: {
        component:
          "The two palettes of the case in use, read from its `colours.ts`: one for light, one for dark, and which one a visitor starts in. Every other script names these colours by their key, so a change to one value changes it everywhere it is used, in the mode it belongs to. Any colour field elsewhere also takes a tint of a palette colour (`\"accent/14\"`), a hex, or `\"transparent\"`.",
      },
    },
  },
};
export default meta;

const USES: Record<keyof Omit<Palette, "chart">, string> = {
  background: "the page behind everything",
  card: "the fill of panels and cards: the three boxes of a play page, the topic tiles, the search window",
  foreground: "text and lines",
  "muted-foreground": "secondary text: the lede, captions, slider names, links at rest",
  border: "borders, rules, the slider track, the hairline under the top bar",
  primary: "the brand colour: tags, the dot before a card title, the pressed primary button; the first plotted line",
  secondary: "the second brand colour: the tint behind a hovered row in the registry elements; the second plotted line",
  destructive: "something went wrong: the blew-up verdict, a warning, the destructive button",
  selected: "what is current or chosen: the active tab, the topic's name, the pressed chip (the primary when left out)",
  glow: "the light: the contour of buttons, the marker under the active link in the bar, the figures' light (the primary when left out)",
  value: "numbers: the value beside a slider, the numbers of a readout (the primary when left out)",
  "primary-foreground": "the letters on a filled primary button (the background when left out)",
  "card-foreground": "the text inside a panel or card (the foreground when left out)",
  link: "a text link (the primary when left out)",
  success: "the good verdict, a passed check (the primary when left out)",
  input: "the fill of a text field (none when left out)",
  ring: "the focus ring (the primary when left out)",
};

const FALLBACK: Partial<Record<keyof Palette, keyof Palette>> = {
  selected: "primary",
  glow: "primary",
  value: "primary",
  "primary-foreground": "background",
  "card-foreground": "foreground",
  link: "primary",
  success: "primary",
  ring: "primary",
};

function Swatch({ name, value, use }: { name: string; value: string; use: string }) {
  return (
    <div className="flex items-center gap-4 border-t border-border py-3">
      <span className="h-12 w-12 shrink-0 rounded-lg border border-border" style={{ background: value }} />
      <div>
        <div className="font-mono text-[12px] text-foreground">
          {name} <span className="text-muted-foreground">{value}</span>
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">{use}</div>
      </div>
    </div>
  );
}

function PaletteList({ palette }: { palette: Palette }) {
  return (
    <div className="max-w-2xl">
      {(Object.keys(USES) as (keyof typeof USES)[]).map((k) => {
        const fallback = FALLBACK[k];
        const value = palette[k] ?? (fallback ? (palette[fallback] as string) : "transparent");
        return <Swatch key={k} name={k} value={value} use={USES[k]} />;
      })}
      <div className="flex gap-3 border-t border-border py-3">
        {palette.chart.map((s, i) => (
          <div key={s} className="text-center">
            <span className="block h-10 w-14 rounded-lg" style={{ background: s }} />
            <span className="font-mono text-[11px] text-muted-foreground">
              {i + 1} {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Light: StoryObj = {
  parameters: { docs: { description: { story: `The light palette${theme.colours.default === "light" ? ", the one a visitor starts in" : ""}.` } } },
  render: () => <PaletteList palette={theme.colours.light} />,
};

export const Dark: StoryObj = {
  parameters: { docs: { description: { story: `The dark palette${theme.colours.default === "dark" ? ", the one a visitor starts in" : ""}.` } } },
  render: () => <PaletteList palette={theme.colours.dark} />,
};
