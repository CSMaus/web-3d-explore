import { useEffect, useRef, useState } from "react";
import type { Job, Tick } from "@/workers/grow.worker";

export function useGrower(job: Omit<Job, "id"> | null) {
  const [tick, setTick] = useState<Tick | null>(null);
  const worker = useRef<Worker | null>(null);
  const latest = useRef(job);
  const id = useRef(0);
  const key = job ? JSON.stringify(job) : "";

  useEffect(() => {
    latest.current = job;
  });

  useEffect(() => {
    const w = new Worker(new URL("@/workers/grow.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    w.onmessage = (event: MessageEvent<Tick>) => {
      if (event.data.id === id.current) setTick(event.data);
    };
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, []);

  useEffect(() => {
    const current = latest.current;
    if (!current || !worker.current || !key) return;
    id.current += 1;
    setTick(null);
    worker.current.postMessage({ ...current, id: id.current });
  }, [key]);

  return tick;
}
