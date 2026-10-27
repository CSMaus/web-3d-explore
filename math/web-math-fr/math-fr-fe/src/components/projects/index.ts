import type { ComponentType } from "react";
import { AliceChat, AliceCut, AliceHero, AlicePick, AliceThumb, AliceTrain } from "./alice";
import { SeriesBoxes, SeriesCoast, SeriesEscape, SeriesFern, SeriesHero, SeriesThumb } from "./series";
import { SiteHero, SiteMove, SiteRead, SiteThumb, SiteWatch, SiteZoom } from "./site";
import { WebpautBscan, WebpautHero, WebpautPulse, WebpautReport, WebpautStream, WebpautThumb } from "./webpaut";

/** each project's figures by slug: the one on its card, the one to try on its page, and one per step */
export type Figures = { Thumb: ComponentType; Hero: ComponentType; steps: Record<string, ComponentType> };

export const FIGURES: Record<string, Figures> = {
  "maths-site": { Thumb: SiteThumb, Hero: SiteHero, steps: { watch: SiteWatch, move: SiteMove, read: SiteRead, zoom: SiteZoom } },
  "fractals-series": { Thumb: SeriesThumb, Hero: SeriesHero, steps: { coast: SeriesCoast, boxes: SeriesBoxes, fern: SeriesFern, escape: SeriesEscape } },
  webpaut: { Thumb: WebpautThumb, Hero: WebpautHero, steps: { pulse: WebpautPulse, bscan: WebpautBscan, stream: WebpautStream, report: WebpautReport } },
  "alice-in-wonderland": { Thumb: AliceThumb, Hero: AliceHero, steps: { cut: AliceCut, pick: AlicePick, write: AliceChat, train: AliceTrain } },
};
