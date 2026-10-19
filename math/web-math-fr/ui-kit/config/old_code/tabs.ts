import { defineTabs } from "../kinds.ts";
import { tabs as from } from "../edge_light/tabs.ts";

// old_code starts from edge_light; change the fields that differ here
export const tabs = defineTabs({ ...from });
