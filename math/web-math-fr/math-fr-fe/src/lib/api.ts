/**
 * the backend, or its absence. VITE_API_BASE names the api; set to nothing, the
 * site runs on its own: the content comes from the snapshot the backend wrote
 * into src/content/snapshot, and everything that needs a server (accounts,
 * saved parameter sets, the deep zoom socket) is off and says so.
 */
export const base: string = import.meta.env.VITE_API_BASE ?? "http://localhost:1585/api";

/** false when the site is built to run without the backend */
export const HAS_BACKEND = base !== "";

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

export type Beat = {
  slug: string;
  seconds: number;
  video: string;
  shows: string;
  why: string;
  say: string;
};
export type Part = { number: number; title: string; video: string; caption: string; question: string; text: string[]; beats: Beat[] };
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
  /** an aside sits beside the reading order rather than in it */
  aside?: boolean;
};
export type Topic = Card & { part_list: Part[] };

const NO_BACKEND = "This needs the backend, and the site is running without one";

async function get<T>(path: string): Promise<T> {
  if (!HAS_BACKEND) throw new Error(NO_BACKEND);
  const res = await fetch(`${base}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status} on ${path}`);
  return (await res.json()) as T;
}

async function send<T>(path: string, body?: unknown): Promise<T> {
  if (!HAS_BACKEND) throw new Error(NO_BACKEND);
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

// the snapshot: one file per content route, loaded only when asked for, so a
// build with a backend never carries them
const snapshot = import.meta.glob<{ default: unknown }>("../content/snapshot/*.json");

async function fromSnapshot<T>(name: string): Promise<T | null> {
  const load = snapshot[`../content/snapshot/${name}.json`];
  if (!load) return null;
  return (await load()).default as T;
}

async function soft<T>(work: Promise<T>): Promise<T | null> {
  try {
    return await work;
  } catch {
    return null;
  }
}

/** content comes from the backend when it answers, and from the snapshot otherwise, so the site reads the same with or without a server */
async function content<T>(path: string, name: string): Promise<T | null> {
  const live = HAS_BACKEND ? await soft(get<T>(path)) : null;
  return live ?? fromSnapshot<T>(name);
}

export const api = {
  topics: () => content<Card[]>("/topics", "topics"),
  topic: (slug: string) => content<Topic>(`/topics/${slug}`, slug),
  theory: (slug: string) => content<Theory>(`/topics/${slug}/equations`, `${slug}.equations`),
  system: async (slug: string, id: string) => {
    const live = HAS_BACKEND ? await soft(get<System>(`/topics/${slug}/equations/${id}`)) : null;
    if (live) return live;
    const theory = await fromSnapshot<Theory>(`${slug}.equations`);
    return theory?.systems.find((s) => s.id === id) ?? null;
  },
  health: () => (HAS_BACKEND ? get<{ status: string }>("/health") : Promise.resolve({ status: "frontend only" })),
  me: () => (HAS_BACKEND ? get<Account | null>("/auth/me") : Promise.resolve(null)),
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
