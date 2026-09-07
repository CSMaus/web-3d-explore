export const base = import.meta.env.VITE_API_BASE ?? "http://localhost:1585/api";

export type Block = { label: string; tex: string; note: string };
export type Dimension = { label: string; tex: string; note: string };
export type System = {
  id: string;
  name: string;
  summary: string;
  blocks: Block[];
  dimension: Dimension;
};
export type Definition = { id: string; name: string; tex: string; note: string };
export type Theory = { systems: System[]; definitions: Definition[] };

export type Account = { email: string; name: string | null };
export type Preset = {
  slug: string;
  system: string;
  title: string | null;
  params: Record<string, unknown>;
  palette: Record<string, unknown>;
  public: boolean;
  created: string;
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status} on ${path}`);
  return (await res.json()) as T;
}

async function send<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: `${res.status}` }));
    throw new Error(detail.detail ?? `${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export type Beat = {
  slug: string;
  seconds: number;
  video: string;
  shows: string;
  why: string;
  say: string;
};
export type Part = { number: number; title: string; beats: Beat[] };
export type State = "ready" | "writing" | "planned";
export type Card = {
  slug: string;
  number: number;
  title: string;
  summary: string;
  state: State;
  parts: number;
  beats: number;
  seconds: number;
  systems: number;
};
export type Topic = Card & { part_list: Part[] };

async function soft<T>(work: Promise<T>): Promise<T | null> {
  try {
    return await work;
  } catch {
    return null;
  }
}

export const api = {
  topics: () => soft(get<Card[]>("/topics")),
  topic: (slug: string) => soft(get<Topic>(`/topics/${slug}`)),
  theory: (slug: string) => soft(get<Theory>(`/topics/${slug}/equations`)),
  system: (slug: string, id: string) => soft(get<System>(`/topics/${slug}/equations/${id}`)),
  health: () => get<{ status: string }>("/health"),
  me: () => get<Account | null>("/auth/me"),
  signup: (email: string, secret: string, name?: string) =>
    send<Account>("/auth/signup", { email, secret, name: name || null }),
  login: (email: string, secret: string) => send<Account>("/auth/login", { email, secret }),
  logout: () => send<void>("/auth/logout"),
  presets: () => get<Preset[]>("/presets"),
  keep: (body: {
    system: string;
    title?: string | null;
    params: Record<string, unknown>;
    palette: Record<string, unknown>;
    public?: boolean;
  }) => send<Preset>("/presets", body),
  preset: (slug: string) => get<Preset>(`/presets/${slug}`),
};
