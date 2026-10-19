import { defineTopBar } from "../kinds.ts";
import { topbar as from } from "../edge_light/topbar.ts";

// old_code starts from edge_light; change the fields that differ here
export const topbar = defineTopBar({ ...from });
