import { Readout as KitReadout } from "@kit/index";

export function Readout({ rows }: { rows: [string, string][] }) {
  return <KitReadout rows={rows} />;
}
