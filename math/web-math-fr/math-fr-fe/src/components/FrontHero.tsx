import { Link } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Choices, Hero, Plot, Tag, TextLink } from "@kit/index";
import { paletteOf } from "@/lib/palettes";
import { CONTOUR_LIGHT, FRONT_BULB_FRAMED, FRONT_LIGHT_SET, FRONT_PALETTE } from "@/lib/site";

const Bulb = lazy(() => import("@/components/Bulb").then((m) => ({ default: m.Bulb })));

type View = "solid" | "contour";

/**
 * the first screen of the front page: the words at the left, and at the right
 * the Mandelbulb turning, drawn live, with no frame around it unless the site
 * says so. one switch: the solid body, or its edges as lines with a light
 * running along them. the palette is set in code.
 */
export function FrontHero() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>("contour");
  const palette = paletteOf(FRONT_PALETTE);
  const canvas = (
    <Suspense fallback={<div className="absolute inset-0" />}>
      <Bulb className="absolute inset-0 h-full w-full" view={view} palette={palette} light={CONTOUR_LIGHT} {...FRONT_LIGHT_SET} />
    </Suspense>
  );
  return (
    <Hero
      eyebrow={t("front.eyebrow")}
      title={
        <>
          <span className="block">{t("front.title1")}</span>
          <span className="block">{t("front.title2")}</span>
        </>
      }
      lede={t("front.lede")}
      actions={
        <>
          <Button asChild>
            <Link to="/topics/fractals/parts">{t("front.start")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/topics">{t("front.browse")}</Link>
          </Button>
        </>
      }
      tags={
        <>
          <Tag>{t("front.tag1")}</Tag>
          <Tag colour="var(--c-chart-3)">{t("front.tag2")}</Tag>
          <Tag colour="var(--chart-3)">{t("front.tag3")}</Tag>
        </>
      }
      picture={
        <div>
          {FRONT_BULB_FRAMED ? <Plot className="relative h-[520px]">{canvas}</Plot> : <div className="relative h-[520px]">{canvas}</div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Choices
              options={[
                { id: "solid", label: t("front.solid") },
                { id: "contour", label: t("front.contour") },
              ]}
              value={view}
              onPick={setView}
            />
            <TextLink asChild>
              <Link to="/topics/fractals/play/mandelbulb">{t("front.open")} ↗</Link>
            </TextLink>
          </div>
        </div>
      }
    />
  );
}
