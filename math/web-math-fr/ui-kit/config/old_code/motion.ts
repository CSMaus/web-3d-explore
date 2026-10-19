import { defineMotion } from "../kinds.ts";
import { motion as from } from "../edge_light/motion.ts";

// old_code starts from edge_light; change the fields that differ here
export const motion = defineMotion({ ...from });
