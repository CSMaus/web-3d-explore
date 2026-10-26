import type { SolidKind } from "@kit/index";

/** the turning figure that stands for each topic, on the front page, the topics, learn and play */
export const SHAPES: Record<string, SolidKind> = {
  complex: "helix",
  fractals: "tetra",
  chaos: "lorenz",
  networks: "network",
  tokens: "attention",
};

/** "Start here" for topic 0, "Topic n" for the others */
export const topicLabel = (number: number, t: (key: string) => string) => (number === 0 ? t("front.startHere") : `${t("front.topic")} ${number}`);
