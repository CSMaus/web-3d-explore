import { useCallback, useEffect, useRef, useState } from "react";
import { base } from "@/lib/api";

export type Ask = {
  cx: number;
  cy: number;
  span: number;
  width: number;
  height: number;
  iters: number;
  ramp: string[];
  body: string;
  shift: number;
};

export type Tile = {
  nonce: number;
  step: number;
  width: number;
  height: number;
  iters: number;
  cx: number;
  cy: number;
  span: number;
  png: string;
  final: boolean;
};

export type Stage =
  | { kind: "idle" }
  | { kind: "opening" }
  | { kind: "working"; step: number; done: number }
  | { kind: "done"; step: number }
  | { kind: "refused"; reason: string }
  | { kind: "busy"; reason: string }
  | { kind: "lost"; reason: string };

/** the socket address, derived from wherever the api itself lives. */
export function socketUrl(): string {
  const at = base.replace(/\/+$/, "");
  if (/^https?:/i.test(at)) return `${at.replace(/^http/i, "ws")}/deep`;
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${window.location.host}${at}/deep`;
}

const LEVELS = 4;
const IDLE: Stage = { kind: "idle" };

/**
 * the client for the deep-zoom route. the socket is opened on the first
 * request rather than on mount, and is closed as soon as a view is finished,
 * because the server allocates capacity for as long as a connection is held
 * whether or not it is computing.
 */
export function useDeep(enabled: boolean) {
  const [tile, setTile] = useState<Tile | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const socket = useRef<WebSocket | null>(null);
  const nonce = useRef(0);
  const pending = useRef<Ask | null>(null);
  const gone = useRef(false);

  const shut = useCallback(() => {
    const live = socket.current;
    socket.current = null;
    pending.current = null;
    if (live && live.readyState <= WebSocket.OPEN) live.close(1000, "finished");
  }, []);

  useEffect(() => {
    gone.current = false;
    return () => {
      gone.current = true;
      shut();
    };
  }, [shut]);

  // closing the socket is the only thing that has to happen here, because the
  // socket is the external system. what is on screen is derived below rather
  // than assigned, so no render cascades out of this.
  useEffect(() => {
    if (!enabled) {
      nonce.current += 1;
      shut();
    }
  }, [enabled, shut]);

  const send = useCallback((live: WebSocket, want: Ask, id: number) => {
    live.send(JSON.stringify({ ...want, nonce: id }));
  }, []);

  const ask = useCallback(
    (want: Ask) => {
      if (!enabled) return;
      const id = ++nonce.current;
      setTile(null);
      setStage({ kind: "opening" });

      const live = socket.current;
      if (live && live.readyState === WebSocket.OPEN) {
        send(live, want, id);
        setStage({ kind: "working", step: 0, done: 0 });
        return;
      }
      if (live && live.readyState === WebSocket.CONNECTING) {
        pending.current = want;
        return;
      }

      pending.current = want;
      let opened: WebSocket;
      try {
        opened = new WebSocket(socketUrl());
      } catch {
        setStage({ kind: "lost", reason: "the socket could not be opened" });
        return;
      }
      socket.current = opened;

      opened.onopen = () => {
        const queued = pending.current;
        pending.current = null;
        if (!queued) return;
        send(opened, queued, nonce.current);
        setStage({ kind: "working", step: 0, done: 0 });
      };

      opened.onmessage = (event) => {
        let body: Record<string, unknown>;
        try {
          body = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (body.kind === "refused") {
          setStage({ kind: "refused", reason: String(body.reason ?? "refused") });
          shut();
          return;
        }
        if (body.kind === "busy") {
          setStage({ kind: "busy", reason: String(body.reason ?? "busy") });
          return;
        }
        if (body.kind !== "tile") return;
        const next = body as unknown as Tile;
        if (typeof next.nonce !== "number") {
          // a server too old to echo the request would otherwise leave the
          // page sitting on the first pass for ever, saying nothing.
          setStage({ kind: "lost", reason: "the server did not answer with the view asked for" });
          shut();
          return;
        }
        // a tile for a view already moved away from is thrown away here; the
        // server cancels what it has not sent, not what is already in flight.
        if (next.nonce !== nonce.current) return;
        setTile(next);
        if (next.final) {
          setStage({ kind: "done", step: next.step });
          shut();
        } else {
          const done = LEVELS - Math.log2(next.step);
          setStage({ kind: "working", step: next.step, done });
        }
      };

      opened.onerror = () => {
        if (gone.current) return;
        setStage({ kind: "lost", reason: "the connection failed" });
      };

      opened.onclose = (event) => {
        if (socket.current === opened) socket.current = null;
        if (gone.current) return;
        setStage((was) =>
          was.kind === "working" || was.kind === "opening"
            ? { kind: "lost", reason: `the connection closed (${event.code})` }
            : was,
        );
      };
    },
    [enabled, send, shut],
  );

  const stop = useCallback(() => {
    nonce.current += 1;
    shut();
    setStage({ kind: "idle" });
  }, [shut]);

  return {
    tile: enabled ? tile : null,
    stage: enabled ? stage : IDLE,
    ask,
    stop,
  };
}
