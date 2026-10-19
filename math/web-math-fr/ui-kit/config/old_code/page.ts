import { definePage } from "../kinds.ts";
import { page as from } from "../edge_light/page.ts";

// old_code starts from edge_light; change the fields that differ here
export const page = definePage({ ...from });
