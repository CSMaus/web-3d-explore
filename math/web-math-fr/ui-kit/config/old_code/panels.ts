import { definePanels } from "../kinds.ts";
import { panels as from } from "../edge_light/panels.ts";

// old_code starts from edge_light; change the fields that differ here
export const panels = definePanels({ ...from });
