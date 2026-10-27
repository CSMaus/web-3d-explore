import { useEffect, useRef, useState } from "react";

/**
 * the front page's Mandelbulb as a baked video (scripts/bake-bulb.mjs): one whole period of the
 * live bulb's turn, in plain H.264, which every computer and phone decodes in its hardware. each
 * frame holds the bulb on black in its top half and its transparency, as grey, in its bottom half;
 * a small WebGL step joins the halves into a transparent picture, one textured square a frame, so
 * the bulb lies over the page and its background as the live one did, on the light and the dark
 * page alike. a small screen gets the 720 px file. a device that should be spared video (data
 * saver on, two cores or less, 2 GB of memory or less), a reader who asked for less motion, and a
 * browser without WebGL get the still frame with its transparency. it plays only while on screen.
 * a file that does not load hands back to the live bulb through onMissing.
 */
const SPARE = (() => {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return Boolean(nav.connection?.saveData) || (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
})();

const VERTEX = `
attribute vec2 at;
varying vec2 uv;
void main() {
  uv = vec2((at.x + 1.0) * 0.5, (1.0 - at.y) * 0.5);
  gl_Position = vec4(at, 0.0, 1.0);
}`;

// the colour from the top half, its transparency from the bottom half; the colour was laid on
// black, so it is already multiplied by its transparency, as the page expects
const FRAGMENT = `
precision mediump float;
varying vec2 uv;
uniform sampler2D frame;
void main() {
  vec3 colour = texture2D(frame, vec2(uv.x, uv.y * 0.5)).rgb;
  float alpha = texture2D(frame, vec2(uv.x, 0.5 + uv.y * 0.5)).r;
  gl_FragColor = vec4(min(colour, vec3(alpha)), alpha);
}`;

function shader(gl: WebGLRenderingContext, kind: number, source: string): WebGLShader | null {
  const s = gl.createShader(kind);
  if (!s) return null;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

export function BakedBulb({ kase, className, onMissing }: { kase: string; className?: string; onMissing?: () => void }) {
  const host = useRef<HTMLCanvasElement | null>(null);
  const [still, setStill] = useState(() => SPARE || (typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)));
  const base = `${import.meta.env.BASE_URL}baked/bulb-${kase}`;
  // the latest hand-back, kept outside the effect so a new one from the page does not restart it
  const missing = useRef(onMissing);
  useEffect(() => {
    missing.current = onMissing;
  });

  useEffect(() => {
    const canvas = host.current;
    if (!canvas || still) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    const vs = gl && shader(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = gl && shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl?.createProgram();
    if (!gl || !vs || !fs || !program) {
      setStill(true);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const at = gl.getAttribLocation(program, "at");
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // the square in the middle of the canvas, sized to its box and the screen's sharpness
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * ratio));
      canvas.height = Math.max(1, Math.round(r.height * ratio));
      const side = Math.min(canvas.width, canvas.height);
      gl.viewport((canvas.width - side) / 2, (canvas.height - side) / 2, side, side);
    };
    fit();
    const resized = new ResizeObserver(fit);
    resized.observe(canvas);

    const small = Math.min(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, 2) < 1100;
    const video = document.createElement("video");
    video.src = `${base}-${small ? 720 : 1080}.mp4`;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.addEventListener("error", () => missing.current?.());

    const draw = () => {
      if (video.readyState < 2) return;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    // a new picture only when the video has a new frame, where the browser can say so
    const framed = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
    let raf = 0;
    let running = false;
    const loop = () => {
      if (!running) return;
      draw();
      if (framed.requestVideoFrameCallback) framed.requestVideoFrameCallback(loop);
      else raf = requestAnimationFrame(loop);
    };
    const watch = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) {
        running = true;
        void video.play().then(loop, () => undefined);
      } else if (!e.isIntersecting) {
        running = false;
        video.pause();
      }
    });
    watch.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      watch.disconnect();
      resized.disconnect();
      video.pause();
      video.removeAttribute("src");
      video.load();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [base, still]);

  if (still) return <img className={`${className ?? ""} object-contain`} src={`${base}.png`} alt="" aria-hidden="true" onError={onMissing} />;
  return <canvas ref={host} className={className} aria-hidden="true" />;
}
