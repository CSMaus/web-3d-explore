import { useEffect, useRef } from "react";
import * as THREE from "three";
import { frag, vert } from "@/gl/escape.glsl";

export type Detail = { width: number; height: number; pixels: number; factor: number };

export type EscapeProps = {
  kind: "julia" | "mandelbrot";
  cx: number;
  cy: number;
  centre: [number, number];
  span: number;
  iters: number;
  radius: number;
  ramp: string[];
  body: string;
  shift?: number;
  className?: string;
  onPick?: (x: number, y: number) => void;
  fine?: number;
  fineFactor?: number;
  fineIters?: number;
  budget?: number;
  onDetail?: (detail: Detail) => void;
};

function toVec(hex: string) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

export function Escape(props: EscapeProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const kit = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    uniforms: Record<string, { value: unknown }>;
    quad: THREE.Mesh;
  } | null>(null);
  const latest = useRef(props);
  const ratio = useRef(1);

  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
    } catch {
      return;
    }
    ratio.current = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(ratio.current);
    node.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const uniforms = {
      uSize: { value: new THREE.Vector2(1, 1) },
      uCentre: { value: new THREE.Vector2(0, 0) },
      uSpan: { value: 1.6 },
      uC: { value: new THREE.Vector2(-0.5, 0.5) },
      uKind: { value: 0 },
      uIters: { value: 180 },
      uRadius: { value: 2 },
      uRamp: { value: [0, 0, 0, 0, 0].map(() => new THREE.Vector3()) },
      uBody: { value: new THREE.Vector3() },
      uShift: { value: 0 },
    };
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms }),
    );
    scene.add(quad);
    kit.current = { renderer, scene, camera, uniforms, quad };

    const paint = () => {
      const p = latest.current;
      const w = Math.max(1, node.clientWidth);
      const h = Math.max(1, node.clientHeight);
      renderer.setPixelRatio(ratio.current);
      renderer.setSize(w, h, false);
      const px = renderer.getPixelRatio();
      (uniforms.uSize.value as THREE.Vector2).set(w * px, h * px);
      (uniforms.uCentre.value as THREE.Vector2).set(p.centre[0], p.centre[1]);
      (uniforms.uC.value as THREE.Vector2).set(p.cx, p.cy);
      uniforms.uSpan.value = p.span;
      uniforms.uKind.value = p.kind === "julia" ? 0 : 1;
      uniforms.uIters.value = p.iters;
      uniforms.uRadius.value = p.radius;
      uniforms.uShift.value = p.shift ?? 0;
      const ramp = uniforms.uRamp.value as THREE.Vector3[];
      p.ramp.slice(0, 5).forEach((hex, i) => ramp[i].copy(toVec(hex)));
      (uniforms.uBody.value as THREE.Vector3).copy(toVec(p.body));
      renderer.render(scene, camera);
    };

    const ro = new ResizeObserver(paint);
    ro.observe(node);
    paint();

    return () => {
      ro.disconnect();
      quad.geometry.dispose();
      (quad.material as THREE.ShaderMaterial).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === node) node.removeChild(renderer.domElement);
      kit.current = null;
    };
  }, []);

  useEffect(() => {
    const kits = kit.current;
    const node = host.current;
    if (!kits || !node) return;
    const raf = requestAnimationFrame(() => {
      const { renderer, scene, camera, uniforms } = kits;
      const w = Math.max(1, node.clientWidth);
      const h = Math.max(1, node.clientHeight);
      ratio.current = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(ratio.current);
      renderer.setSize(w, h, false);
      const px = renderer.getPixelRatio();
      (uniforms.uSize.value as THREE.Vector2).set(w * px, h * px);
      (uniforms.uCentre.value as THREE.Vector2).set(props.centre[0], props.centre[1]);
      (uniforms.uC.value as THREE.Vector2).set(props.cx, props.cy);
      uniforms.uSpan.value = props.span;
      uniforms.uKind.value = props.kind === "julia" ? 0 : 1;
      uniforms.uIters.value = props.iters;
      uniforms.uRadius.value = props.radius;
      uniforms.uShift.value = props.shift ?? 0;
      const ramp = uniforms.uRamp.value as THREE.Vector3[];
      props.ramp.slice(0, 5).forEach((hex, i) => ramp[i].copy(toVec(hex)));
      (uniforms.uBody.value as THREE.Vector3).copy(toVec(props.body));
      renderer.render(scene, camera);
      props.onDetail?.({
        width: Math.round(w * ratio.current),
        height: Math.round(h * ratio.current),
        pixels: Math.round(w * ratio.current) * Math.round(h * ratio.current),
        factor: 1,
      });
    });
    return () => cancelAnimationFrame(raf);
  });

  const fineNonce = props.fine;

  useEffect(() => {
    const kits = kit.current;
    const node = host.current;
    const p = latest.current;
    if (!kits || !node || !fineNonce) return;
    const { renderer, scene, camera, uniforms } = kits;
    const gl = renderer.getContext();
    const cap = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
    const w = Math.max(1, node.clientWidth);
    const h = Math.max(1, node.clientHeight);
    const base = Math.min(window.devicePixelRatio, 2);
    const budget = p.budget ?? 24_000_000;
    let factor = p.fineFactor ?? 3;
    while (factor > 1) {
      const pw = Math.round(w * base * factor);
      const ph = Math.round(h * base * factor);
      if (pw <= cap && ph <= cap && pw * ph <= budget) break;
      factor -= 0.25;
    }
    ratio.current = base * factor;
    renderer.setPixelRatio(ratio.current);
    renderer.setSize(w, h, false);
    const px = renderer.getPixelRatio();
    (uniforms.uSize.value as THREE.Vector2).set(w * px, h * px);
    uniforms.uIters.value = p.fineIters ?? p.iters;
    renderer.render(scene, camera);
    p.onDetail?.({
      width: Math.round(w * px),
      height: Math.round(h * px),
      pixels: Math.round(w * px) * Math.round(h * px),
      factor,
    });
  }, [fineNonce]);

  const click = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!props.onPick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const short = Math.min(rect.width, rect.height);
    const ux = ((event.clientX - rect.left) * 2 - rect.width) / short;
    const uy = -(((event.clientY - rect.top) * 2 - rect.height) / short);
    props.onPick(props.centre[0] + ux * props.span, props.centre[1] + uy * props.span);
  };

  return (
    <div
      ref={host}
      className={props.className}
      onClick={click}
      style={{ cursor: props.onPick ? "crosshair" : "default" }}
    />
  );
}
