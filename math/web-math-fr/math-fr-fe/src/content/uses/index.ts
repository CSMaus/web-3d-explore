import { POPULATIONS, SPACECRAFT, WEATHER } from "./chaos";
import { CURRENT, FREQUENCIES } from "./complex";
import { ACTUARIAL, ANTENNAS, RESERVOIRS, TRAFFIC } from "./fractals";
import type { Piece } from "./kinds";
import { POSTCODES, PROTEINS, SKIN, SPEECH } from "./networks";
import { CODE, SEARCH, SPAM, TRANSLATION } from "./tokens";

/** every application piece, by topic and id. */
export const PIECES: Piece[] = [
  ACTUARIAL,
  RESERVOIRS,
  TRAFFIC,
  ANTENNAS,
  WEATHER,
  POPULATIONS,
  SPACECRAFT,
  CURRENT,
  FREQUENCIES,
  POSTCODES,
  SKIN,
  SPEECH,
  PROTEINS,
  TRANSLATION,
  CODE,
  SEARCH,
  SPAM,
];

export function pieceAt(topic: string, id: string): Piece | null {
  return PIECES.find((p) => p.topic === topic && p.id === id) ?? null;
}
