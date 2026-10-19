import { cn } from "cn";
import { Slider as SliderBase } from "./ui/slider";

/**
 * the controls a page is built from. a group of choices is a row of buttons
 * with one pressed, named with the toggle-group slots so the theme's tab
 * rules write onto it; the choice is never a radio, so a page can find it as
 * a button by its name.
 */

function Group({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="toggle-group" role="group" className={cn("flex flex-wrap", className)} {...props} />;
}

function Item({ on, className, ...props }: React.ComponentProps<"button"> & { on: boolean }) {
  return (
    <button
      type="button"
      data-slot="toggle-group-item"
      data-state={on ? "on" : "off"}
      aria-pressed={on}
      className={cn("inline-flex items-center justify-center whitespace-nowrap outline-none", className)}
      {...props}
    />
  );
}

/** one of several, named. the group always has a value. */
export function Choices<T extends string>({
  options,
  value,
  onPick,
  className,
}: {
  options: { id: T; label: string }[];
  value: T;
  onPick: (id: T) => void;
  className?: string;
}) {
  return (
    <Group className={className}>
      {options.map((o) => (
        <Item key={o.id} on={o.id === value} onClick={() => onPick(o.id)}>
          {o.label}
        </Item>
      ))}
    </Group>
  );
}

/** a small square in a colour before a label, so the label keeps the text colour and stays readable on any page. */
export function Swatch({ colour }: { colour: string }) {
  return <span aria-hidden="true" data-slot="swatch" className="mr-1.5 inline-block size-2.5 shrink-0 rounded-sm align-middle" style={{ background: colour }} />;
}

/** the same, for plain strings, with an optional colour per item shown as a swatch before it. */
export function Chips({
  items,
  active,
  onPick,
  tint,
  className,
}: {
  items: string[];
  active: string;
  onPick: (item: string) => void;
  tint?: (item: string, i: number) => string | undefined;
  className?: string;
}) {
  return (
    <Group className={className}>
      {items.map((item, i) => {
        const colour = tint?.(item, i);
        return (
          <Item key={item} on={item === active} onClick={() => onPick(item)}>
            {colour ? <Swatch colour={colour} /> : null}
            {item}
          </Item>
        );
      })}
    </Group>
  );
}

/** a named slider with its value read out, laid out as the theme says. */
export function Field({
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
  className,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  className?: string;
}) {
  const shown = format ? format(value) : String(value);
  return (
    <div data-slot="field" className={className}>
      <span data-slot="field-name" aria-hidden="true">{label}</span>
      <div data-slot="field-control">
        <SliderBase min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} thumbLabel={label} valueText={shown} />
      </div>
      <span data-slot="field-value" aria-hidden="true">{shown}</span>
    </div>
  );
}

export { SliderBase as Slider };
