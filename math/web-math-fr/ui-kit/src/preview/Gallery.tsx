import { useState } from "react";
import { CASE, CASE_NAMES, theme } from "../../config/index.ts";
import { TEXT_SLOTS, type TextStyle } from "../../config/kinds.ts";
import { Chips, Choices, Field } from "../components/controls";
import { EdgeFigure } from "../components/figures";
import { FIGURE_KINDS, FIGURE_NAMES } from "../lib/figures";
import { Banner, Caption, CaseSwitch, Counter, Figure, Heading, IconCard, Label, LanguageSwitch, Lede, ModeSwitch, Panel, PanelHead, Plot, Readout, ScrollHint, SearchButton, Share, Strip, Tag, Verdict } from "../components/pieces";
import { caseLabels, pickCase } from "../lib/case";
import { useModeChoice } from "../lib/mode";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

/**
 * every element the kit has, in one column, so a change to the config can be
 * judged on all of them at once. the site shows this under its new front page
 * on a development-only address; the kit shows it on its own dev server. the
 * text section is read from the config itself: one row per style, with its
 * name, where it is used, and a sample set in that style.
 */

const SAMPLE = "Count the boxes the edge passes through";

/** the attributes that put a sample into the named style, the way the real element carries it. */
function sampleProps(name: string): Record<string, string> {
  if (name.startsWith("heading")) return { "data-slot": "heading", "data-level": name.slice(7) };
  if (name === "body") return {};
  if (name === "readoutValue") return { "data-slot": "readout-value-sample" };
  const slot: Record<string, string> = {
    brand: "topbar-brand",
    nav: "topbar-link",
    search: "search-button",
    panelHead: "panel-head",
    field: "field-name",
    fieldValue: "field-value",
  };
  if ((TEXT_SLOTS as readonly string[]).includes(name)) return { "data-slot": slot[name] ?? name };
  return { "data-text": name };
}

function spec(s: TextStyle): string {
  const extras = [s.background && s.background !== "transparent" ? `on ${s.background}` : "", s.padding ? `padding ${s.padding[0]}/${s.padding[1]}` : ""].filter(Boolean);
  return [s.font, `${s.size}px`, `weight ${s.weight}`, `leading ${s.leading}`, `${s.tracking}em`, s.case, s.colour, ...extras].join(" · ");
}

function TextRow({ name, style }: { name: string; style: TextStyle }) {
  const props = sampleProps(name);
  const sample = name === "readoutValue" ? <dl data-slot="readout" style={{ display: "block" }}><dt style={{ display: "none" }}>Sample</dt><dd style={{ textAlign: "left" }}>{SAMPLE}</dd></dl> : <span {...props} style={{ position: "static", visibility: "visible", display: "inline-block" }}>{SAMPLE}</span>;
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

const CASES = caseLabels(CASE_NAMES);

function Switches() {
  const [mode, pick] = useModeChoice(theme.colours.default);
  return (
    <div className="flex flex-wrap items-center gap-6">
      <ModeSwitch mode={mode} onChange={pick} labels={{ light: "Light", dark: "Dark" }} />
      <CaseSwitch value={CASE} names={CASES} onChange={(c) => void pickCase(c)} label="Theme" />
    </div>
  );
}

function ButtonStates() {
  const looks = ["rest", "hover", "pressed"] as const;
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {looks.map((l) => (
        <div key={l} className="space-y-2">
          <div className="font-mono text-[11px] text-muted-foreground">{l}</div>
          <div className="flex flex-wrap gap-2">
            <Button data-look={l}>Primary</Button>
            <Button variant="outline" data-look={l}>Plain</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Gallery() {
  const [kind, setKind] = useState("split");
  const [chip, setChip] = useState("Leaf");
  const [rate, setRate] = useState(0.3);
  const [units, setUnits] = useState(12);
  const [name, setName] = useState("warm-paper");
  const [on, setOn] = useState(true);
  const [lang, setLang] = useState("en");
  const tints: Record<string, string> = { Leaf: "#7ff0d8", Sky: "#9b8cf5", Gold: "#e5c76b", Rose: "#f08fb7" };
  const styles = Object.entries(theme.text.styles);

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <Heading level={2}>Mode</Heading>
        <p className="font-mono text-[11px] text-muted-foreground">The theme is the word in config/case.ts: the select writes it there through the dev server, the sheet is rebuilt and the page loads again. The mode is light or dark within the theme, saved in the browser.</p>
        <Switches />
      </section>

      <section className="space-y-4">
        <Heading level={2}>Figures and furniture</Heading>
        <p className="font-mono text-[11px] text-muted-foreground">The four figures from figures.ts with the light running; an icon card; the counter, the scroll hint and the share control.</p>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {FIGURE_KINDS.map((k) => (
            <div key={k} className="space-y-2">
              <div className="aspect-square p-3">
                <EdgeFigure kind={k} />
              </div>
              <div className="text-center font-mono text-[11px] text-muted-foreground">{FIGURE_NAMES[k]}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <IconCard figure={<EdgeFigure kind="triangle" />} title="Business consulting">
            A look at how an organisation works and where a model would change it.
          </IconCard>
          <div className="flex flex-col items-start justify-end gap-4">
            <Counter at={2} of={5} />
            <ScrollHint label="Scroll" />
            <Share label="Share" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Heading level={2}>Text</Heading>
        <p className="font-mono text-[11px] text-muted-foreground">Every kind of text in the app, from text.ts: its name, where it is used, a sample, and how it is set. A new entry there appears here on its own and is used with the Text element.</p>
        <div>
          {styles.map(([k, s]) => (
            <TextRow key={k} name={k} style={s} />
          ))}
        </div>
        <div className="flex flex-wrap gap-6">
          <Tag>No prerequisites</Tag>
          <Tag colour="#9b8cf5">Learn at your pace</Tag>
          <Tag colour="#e5c76b">Free to explore</Tag>
        </div>
        <Label>A section label</Label>
      </section>

      <section className="space-y-4">
        <Heading level={2}>Buttons</Heading>
        <p className="font-mono text-[11px] text-muted-foreground">The three states from buttons.ts, held still, then the live buttons.</p>
        <ButtonStates />
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Plain</Button>
          <Button variant="outline" disabled>Disabled</Button>
          <Button variant="outline" aria-pressed="true">Pressed</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Stop</Button>
          <Button variant="link">A link</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SearchButton label="Search" shortcut="⌘K" />
          <LanguageSwitch value={lang} onChange={setLang} label="Language" options={[{ code: "en", label: "EN", name: "English" }, { code: "xx", label: "XX", name: "Another" }]} />
          <Badge>Ready</Badge>
          <Badge variant="outline">Being written</Badge>
        </div>
      </section>

      <section className="space-y-4">
        <Heading level={2}>Choices and tabs</Heading>
        <Choices
          options={[
            { id: "split", label: "Two clouds" },
            { id: "xor", label: "Exclusive or" },
            { id: "rings", label: "A ring inside a ring" },
          ]}
          value={kind}
          onPick={setKind}
        />
        <Chips items={Object.keys(tints)} active={chip} onPick={setChip} tint={(i) => tints[i]} />
        <Tabs defaultValue="parts">
          <TabsList>
            <TabsTrigger value="parts">Parts</TabsTrigger>
            <TabsTrigger value="play">Play</TabsTrigger>
            <TabsTrigger value="maths">Mathematics</TabsTrigger>
            <TabsTrigger value="uses">Applications</TabsTrigger>
          </TabsList>
          <TabsContent value="parts" className="pt-3 text-sm">The series, in order.</TabsContent>
          <TabsContent value="play" className="pt-3 text-sm">Every page that moves.</TabsContent>
          <TabsContent value="maths" className="pt-3 text-sm">The equations.</TabsContent>
          <TabsContent value="uses" className="pt-3 text-sm">Where it is used.</TabsContent>
        </Tabs>
      </section>

      <section className="max-w-md space-y-4">
        <Heading level={2}>Fields</Heading>
        <Field label="Step size" min={0.01} max={3} step={0.01} value={rate} format={(v) => v.toFixed(2)} onChange={setRate} />
        <Field label="Units" min={2} max={40} step={1} value={units} format={(v) => `${v}`} onChange={setUnits} />
        <Input value={name} onChange={(e) => setName(e.target.value)} spellCheck={false} aria-label="A name" />
        <div className="flex items-center gap-3 text-sm">
          <Switch checked={on} onCheckedChange={setOn} aria-label="Sections rise in" /> Sections rise in
        </div>
      </section>

      <section className="space-y-4">
        <Heading level={2}>Panels and text</Heading>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel label="What goes in">
            <p className="text-sm">The controls of a page sit here, under a label the theme styles.</p>
          </Panel>
          <Panel label="Run" tone="primary">
            <div className="flex gap-2">
              <Button>Run</Button>
              <Button variant="outline">One step</Button>
              <Button variant="outline">Reset</Button>
            </div>
          </Panel>
          <Panel>
            <PanelHead meta="z² + c · 380 iter.">Mandelbrot explorer</PanelHead>
            <Figure>
              <Plot className="h-40" />
              <Caption>A picture and what it shows, said under it and never drawn over it</Caption>
            </Figure>
          </Panel>
          <Panel label="What came out">
            <div className="space-y-2">
              <Verdict good>Done: every dot right after 412 steps. How wrong: 0.0031.</Verdict>
              <Verdict good={false}>The run blew up after 23 steps.</Verdict>
              <Verdict>The dot (0, 1) is about to go in. Press run.</Verdict>
              <Readout rows={[["Method", "Gradient descent"], ["Numbers being moved", "25"], ["Runs kept", "3"]]} />
            </div>
          </Panel>
        </div>
        <Separator />
        <Strip>
          <span>Observation 01 / Fractals</span>
          <span>New: why the Mandelbrot set never repeats</span>
          <span>Scroll to discover ↓</span>
        </Strip>
        <Banner className="!static">
          <p className="text-xs">A banner, as the consent notice is shown: a bar or a card, by the config.</p>
        </Banner>
        <Lede>The paragraph under a display line, at its configured size and colour.</Lede>
      </section>
    </div>
  );
}
