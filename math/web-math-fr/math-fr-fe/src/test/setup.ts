import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

class Watcher {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

vi.stubGlobal("ResizeObserver", Watcher);
vi.stubGlobal("IntersectionObserver", Watcher);

class Idle {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage() {}
  terminate() {}
  addEventListener() {}
  removeEventListener() {}
}

vi.stubGlobal("Worker", Idle);

if (!window.matchMedia) {
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    media: "",
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

/**
 * jsdom has no canvas, so drawing is stubbed. every method a page actually
 * calls has to be here: a missing one throws inside the draw effect, React
 * tears the whole tree down, and the test fails reporting that a heading is
 * missing rather than that a method is.
 */
HTMLCanvasElement.prototype.getContext = vi.fn(
  () =>
    ({
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      ellipse: () => {},
      rect: () => {},
      quadraticCurveTo: () => {},
      bezierCurveTo: () => {},
      stroke: () => {},
      fill: () => {},
      clip: () => {},
      fillText: () => {},
      strokeText: () => {},
      measureText: () => ({ width: 0 }),
      setLineDash: () => {},
      getLineDash: () => [],
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      transform: () => {},
      setTransform: () => {},
      resetTransform: () => {},
      createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      getImageData: (_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
        width: w,
        height: h,
      }),
      putImageData: () => {},
      drawImage: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
    }) as unknown as CanvasRenderingContext2D,
) as unknown as typeof HTMLCanvasElement.prototype.getContext;
