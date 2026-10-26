import { Link } from "@tanstack/react-router";
import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Choices, Hero, Plot, Tag, TextLink } from "@kit/index";
import { paletteOf } from "@/lib/palettes";
import { CONTOUR_LIGHT, FRONT_BULB_FRAMED, FRONT_LIGHT_SET, FRONT_PALETTE } from "@/lib/site";

const Bulb = lazy(() => import("@/components/Bulb").then((m) => ({ default: m.Bulb })));

type View = "solid" | "contour";

/**
 * the first screen of the front page: the Mandelbulb turning large behind the
 * right of the screen, off its edge, drawn live; the words low at the left, clear
 * of it; at the lower right one switch, the solid body or its edges with a light
 * running along them, and the way to its page. the palette is set in code.
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
          <Tag>{t("front.tag2")}</Tag>
          <Tag>{t("front.tag3")}</Tag>
        </>
      }
      picture={FRONT_BULB_FRAMED ? <Plot className="relative h-full">{canvas}</Plot> : <div className="relative h-full">{canvas}</div>}
      aside={
        <>
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
        </>
      }
    />
  );
}
