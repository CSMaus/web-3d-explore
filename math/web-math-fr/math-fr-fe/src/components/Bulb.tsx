import { useEffect, useRef } from "react";
import * as THREE from "three";
import { frag, vert } from "@/gl/bulb.glsl";
import { useLook } from "@/lib/store";

const PERIOD_MS = 42000;
const SCALE_MIN = 0.4;
const SCALE_MAX = 0.85;
const STEPS_FIXED = 110;
const TARGET_MS = 22;
const TAU = Math.PI * 2;

export type BulbProps = {
  className?: string;
  power?: number;
  inner?: number;
  zoom?: number;
  period?: number;
  pulse?: number;
  keyLight?: number;
  fill?: number;
  shine?: number;
  glow?: number;
  haze?: number;
  turning?: boolean;
  azimuth?: number;
  elevation?: number;
};

const DEFAULTS = {
  power: 8,
  inner: 9,
  zoom: 1,
  period: PERIOD_MS,
  pulse: 0,
  keyLight: 0,
  fill: 0.26,
  shine: 0,
  glow: 1.78,
  haze: 0.5,
  turning: true,
  azimuth: 0,
  elevation: 0.45,
};

function toVec(hex: string) {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

export function Bulb({ className, ...given }: BulbProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const ramp = useLook((s) => s.palette.ramp);
  const back = useLook((s) => s.palette.back);
  const settings = { ...DEFAULTS, ...given, ramp, back };
  const latest = useRef(settings);
  const dirty = useRef(true);

  useEffect(() => {
    latest.current = settings;
    dirty.current = true;
  });

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
    } catch {
      return;
    }

    let scale = SCALE_MIN + 0.2;
    const ratio = () => Math.min(window.devicePixelRatio, 1.5) * scale;
    renderer.setPixelRatio(ratio());
    node.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const uniforms = {
      uSize: { value: new THREE.Vector2(1, 1) },
      uPhase: { value: 0 },
      uSteps: { value: STEPS_FIXED },
      uRamp: { value: [0, 0, 0, 0, 0].map(() => new THREE.Vector3()) },
      uBack: { value: new THREE.Vector3() },
      uPower: { value: DEFAULTS.power },
      uInner: { value: DEFAULTS.inner },
      uZoom: { value: DEFAULTS.zoom },
      uPulse: { value: DEFAULTS.pulse },
      uSpin: { value: 0 },
      uElev: { value: DEFAULTS.elevation },
      uKey: { value: DEFAULTS.keyLight },
      uFill: { value: DEFAULTS.fill },
      uShine: { value: DEFAULTS.shine },
      uGlow: { value: DEFAULTS.glow },
      uHaze: { value: DEFAULTS.haze },
    };

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms }),
    );
    scene.add(quad);

    const resize = () => {
      const w = node.clientWidth || 1;
      const h = node.clientHeight || 1;
      renderer.setPixelRatio(ratio());
      renderer.setSize(w, h, false);
      const px = renderer.getPixelRatio();
      uniforms.uSize.value.set(w * px, h * px);
      dirty.current = true;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(node);

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      dirty.current = true;
    }, { threshold: 0.01 });
    io.observe(node);

    let raf = 0;
    let last = performance.now();
    let smooth = TARGET_MS;
    let started = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const p = latest.current;
      if (!visible || document.hidden) {
        started += now - last;
        last = now;
        return;
      }
      const dt = now - last;
      last = now;
      smooth = smooth * 0.9 + Math.min(dt, 120) * 0.1;

      const moving = p.turning && !still;
      if (!moving && !dirty.current) return;

      if (smooth > TARGET_MS * 1.4 && scale > SCALE_MIN) {
        scale = Math.max(SCALE_MIN, scale - 0.05);
        resize();
      } else if (smooth < TARGET_MS * 0.6 && scale < SCALE_MAX) {
        scale = Math.min(SCALE_MAX, scale + 0.02);
        resize();
      }

      const phase = moving ? ((now - started) % p.period) / p.period : 0;
      uniforms.uPhase.value = phase;
      uniforms.uSpin.value = moving ? (phase * TAU) / p.power : p.azimuth;
      uniforms.uElev.value = p.elevation;
      uniforms.uPower.value = p.power;
      uniforms.uInner.value = p.inner;
      uniforms.uZoom.value = p.zoom;
      uniforms.uPulse.value = p.pulse;
      uniforms.uKey.value = p.keyLight;
      uniforms.uFill.value = p.fill;
      uniforms.uShine.value = p.shine;
      uniforms.uGlow.value = p.glow;
      uniforms.uHaze.value = p.haze;
      p.ramp.slice(0, 5).forEach((hex, i) => uniforms.uRamp.value[i].copy(toVec(hex)));
      uniforms.uBack.value.copy(toVec(p.back));

      renderer.render(scene, camera);
      dirty.current = false;
    };
    raf = requestAnimationFrame(draw);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      quad.geometry.dispose();
      (quad.material as THREE.ShaderMaterial).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === node) node.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} className={className} aria-hidden="true" />;
}

export const BULB_DEFAULTS = DEFAULTS;
