import { Field } from "@kit/index";

/** a named slider with its value: the kit's field, under the name every page imports. */
export function Slider(props: Parameters<typeof Field>[0]) {
  return <Field {...props} />;
}
