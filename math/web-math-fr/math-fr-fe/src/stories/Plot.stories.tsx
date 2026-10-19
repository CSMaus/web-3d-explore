import type { Meta, StoryObj } from "@storybook/react-vite";
import { Caption } from "@/components/Caption";
import { Plot } from "@/components/Plot";
import { FAINT, INK, ONE, SKY, TWO, shadePlane, ticks } from "@/lib/draw";

const meta: Meta = { title: "Pictures/Plot" };
export default meta;

export const LinesAndDots: StoryObj = {
  render: () => (
    <div className="max-w-xl">
      <div data-slot="plot" className="h-[320px] overflow-hidden">
        <Plot
          className="h-full w-full"
          box={{ x0: -1, x1: 50, y0: -0.05, y1: 1.05 }}
          deps={[]}
          draw={(pen) => {
            ticks(pen);
            pen.axes(FAINT);
            pen.line(
              Array.from({ length: 50 }, (_, i) => [i, Math.exp(-i / 12)] as [number, number]),
              ONE,
              2,
            );
            pen.line(
              Array.from({ length: 50 }, (_, i) => [i, 1 - Math.exp(-i / 20)] as [number, number]),
              TWO,
              2,
            );
            for (let i = 0; i < 50; i += 7) pen.dot(i, 0.5 + 0.3 * Math.sin(i / 5), 4, SKY);
            pen.ring(21, 0.5 + 0.3 * Math.sin(21 / 5), 9, INK, 1.5);
          }}
        />
      </div>
      <Caption>Two curves, a few dots and a ring, in the theme's colours</Caption>
    </div>
  ),
};

export const ShadedPlane: StoryObj = {
  render: () => (
    <div className="max-w-md">
      <div data-slot="plot" className="h-[320px] overflow-hidden">
        <Plot
          className="h-full w-full"
          box={{ x0: -2, x1: 2, y0: -2, y1: 2 }}
          equal
          deps={[]}
          draw={(pen) => {
            shadePlane(pen, (x, y) => 1 / (1 + Math.exp(-(1.4 * x + 0.8 * y))), 48);
            ticks(pen);
            for (let i = 0; i < 40; i++) {
              const t = (i / 40) * Math.PI * 2;
              const side = i % 2;
              pen.dot(
                Math.cos(t) * (side ? 1.4 : 0.5),
                Math.sin(t) * (side ? 1.4 : 0.5),
                4,
                side ? ONE : TWO,
              );
            }
          }}
        />
      </div>
      <Caption>The plane coloured by a unit's answer, with the two colours of dots</Caption>
    </div>
  ),
};
