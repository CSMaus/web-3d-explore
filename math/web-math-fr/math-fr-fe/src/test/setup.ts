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

HTMLCanvasElement.prototype.getContext = vi.fn(
  () =>
    ({
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
      save: () => {},
      restore: () => {},
      setTransform: () => {},
      createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: () => {},
      drawImage: () => {},
    }) as unknown as CanvasRenderingContext2D,
) as unknown as typeof HTMLCanvasElement.prototype.getContext;
