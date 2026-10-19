import { defineTabs } from "../kinds.ts";
import { tabs as base } from "../base/tabs.ts";

// tabs of edge_light: plain text links, the chosen one in the primary.
export const tabs = defineTabs({ ...base, style: "links", gap: 10 });
