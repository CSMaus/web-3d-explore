import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Path } from "@/systems/flow";

export type OrbitProps = {
  /** the trajectory to draw, and optionally a second one beside it */
  paths: Path[];
  colours: string[];
  back: string;
  className?: string;
  /** turning on its own, or aimed by hand */
  turning: boolean;
  azimuth: number;
  elevation: number;
  zoom: number;
  /** seconds for one turn when it is turning on its own */
  period: number;
  /** how much of each path to show, 0 to 1 */
  reveal?: number;
  /** a dot at the revealed end of each path: the state now */
  heads?: boolean;
  /** the picture was dragged: the page switches to aiming by hand and takes the new aim */
  onAim?: (azimuth: number, elevation: number) => void;
  /** the wheel was turned over the picture */
  onZoom?: (zoom: number) => void;
  /** a page whose paths change in place bumps this so the lines are rebuilt */
  version?: number;
};

/**
 * a trajectory in three dimensions, as a line. one draw call a path, with the
 * whole buffer uploaded once and only the draw range changed as the reveal
 * moves, so scrubbing costs nothing.
 */
export function Orbit3(props: OrbitProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const latest = useRef(props);

  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    node.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 4000);
    const holder = new THREE.Group();
    scene.add(holder);

    let lines: THREE.Line[] = [];
    let heads: THREE.Mesh[] = [];
    let centre = new THREE.Vector3();
    let reach = 1;
    let shape = "";

    const build = () => {
      for (const l of lines) {
        holder.remove(l);
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      }
      lines = [];
      for (const m of heads) {
        holder.remove(m);
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
      heads = [];

      const { paths, colours } = latest.current;
      const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
      const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
      paths.forEach((p, i) => {
        const pos = new Float32Array(p.count * 3);
        for (let k = 0; k < p.count; k++) {
          const x = p.xs[k * p.dim];
          const y = p.xs[k * p.dim + 1];
          const z = p.dim > 2 ? p.xs[k * p.dim + 2] : 0;
          pos[k * 3] = x;
          pos[k * 3 + 1] = y;
          pos[k * 3 + 2] = z;
          lo.min(new THREE.Vector3(x, y, z));
          hi.max(new THREE.Vector3(x, y, z));
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(colours[i % colours.length]),
          transparent: true,
          opacity: paths.length > 1 ? 0.85 : 0.95,
        });
        const line = new THREE.Line(geo, mat);
        line.frustumCulled = false;
        holder.add(line);
        lines.push(line);
      });

      centre = lo.clone().add(hi).multiplyScalar(0.5);
      reach = Math.max(hi.x - lo.x, hi.y - lo.y, hi.z - lo.z, 1e-6);
      holder.position.copy(centre).multiplyScalar(-1);

      paths.forEach((_, i) => {
        const geo = new THREE.SphereGeometry(reach * 0.012, 12, 12);
        const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colours[i % colours.length]) });
        const head = new THREE.Mesh(geo, mat);
        head.visible = false;
        holder.add(head);
        heads.push(head);
      });
    };

    const signature = () =>
      latest.current.paths.map((p) => `${p.count}:${p.dim}:${p.xs[0]}`).join("|") +
      "#" +
      latest.current.colours.join(",") +
      "@" +
      (latest.current.version ?? 0);

    let frame = 0;
    let started = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const p = latest.current;
      if (!started) started = now;

      const sig = signature();
      if (sig !== shape) {
        shape = sig;
        build();
      }

      const rect = node.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }

      const spin = p.turning ? ((now - started) / (p.period * 1000)) * Math.PI * 2 : p.azimuth;
      const lift = p.turning ? 0.42 : p.elevation;
      const away = (reach * 1.55) / Math.max(0.2, p.zoom);
      camera.position.set(
        Math.cos(spin) * Math.cos(lift) * away,
        Math.sin(lift) * away,
        Math.sin(spin) * Math.cos(lift) * away,
      );
      // the up vector follows the elevation so the view stays defined straight above and below
      camera.up.set(-Math.cos(spin) * Math.sin(lift), Math.cos(lift), -Math.sin(spin) * Math.sin(lift));
      camera.lookAt(0, 0, 0);

      const show = Math.max(0.001, Math.min(1, p.reveal ?? 1));
      for (let i = 0; i < lines.length; i++) {
        const path = latest.current.paths[i];
        const count = path?.count ?? 0;
        const upTo = Math.max(2, Math.floor(count * show));
        lines[i].geometry.setDrawRange(0, upTo);
        const head = heads[i];
        if (head && path) {
          head.visible = !!p.heads;
          const k = Math.min(count - 1, upTo - 1);
          head.position.set(path.xs[k * path.dim], path.xs[k * path.dim + 1], path.dim > 2 ? path.xs[k * path.dim + 2] : 0);
        }
      }

      renderer.setClearColor(new THREE.Color(p.back), 1);
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);

    // aiming by hand: a drag turns the picture and the wheel brings it closer.
    // the page owns the numbers; this only reports what the gesture asked for.
    let grab: { x: number; y: number; azimuth: number; elevation: number } | null = null;
    const el = renderer.domElement;
    el.style.touchAction = "none";
    el.style.cursor = "grab";
    const down = (e: PointerEvent) => {
      const p = latest.current;
      // a drag in auto mode reads the current spin so the picture does not jump
      const spinNow = p.turning ? (((performance.now() - started) / (p.period * 1000)) * Math.PI * 2) % (Math.PI * 2) : p.azimuth;
      grab = { x: e.clientX, y: e.clientY, azimuth: spinNow, elevation: p.turning ? 0.42 : p.elevation };
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!grab) return;
      const az = grab.azimuth - (e.clientX - grab.x) * 0.006;
      const elv = Math.min(Math.PI / 2, Math.max(-Math.PI / 2, grab.elevation + (e.clientY - grab.y) * 0.006));
      latest.current.onAim?.(az, elv);
    };
    const up = () => {
      grab = null;
      el.style.cursor = "grab";
    };
    const wheel = (e: WheelEvent) => {
      if (!latest.current.onZoom) return;
      e.preventDefault();
      const z = latest.current.zoom * Math.exp(-e.deltaY * 0.0015);
      latest.current.onZoom(Math.min(4, Math.max(0.3, z)));
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      for (const m of heads) {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      }
      for (const l of lines) {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === node) node.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} className={props.className} />;
}
