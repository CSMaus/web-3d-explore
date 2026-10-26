import { useEffect, useRef } from "react";
import sleeping from "../assets/cat/sleeping.png";

/**
 * the pixel case's kitten, from the CatUI pack (CatRoom): asleep in the bottom corner of the front
 * page. its sheet is a row of six 48 px frames, stepped and never blended, drawn at one and a half
 * times its size with the pixels kept hard. a reader who asked for less motion gets the first
 * frame, still.
 */
const FRAMES = 6;
const SECONDS = 1.6;
const SIDE = 72;

export function Kitten() {
  const sprite = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sprite.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const run = el.animate([{ backgroundPosition: "0 0" }, { backgroundPosition: `-${SIDE * FRAMES}px 0` }], {
      duration: SECONDS * 1000,
      iterations: Infinity,
      easing: `steps(${FRAMES})`,
    });
    return () => run.cancel();
  }, []);

  return (
    <div data-slot="kitten" aria-hidden="true">
      <div
        ref={sprite}
        style={{
          width: SIDE,
          height: SIDE,
          backgroundImage: `url(${sleeping})`,
          backgroundSize: `${SIDE * FRAMES}px ${SIDE}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
