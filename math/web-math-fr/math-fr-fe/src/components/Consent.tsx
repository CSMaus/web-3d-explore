import { useState } from "react";

const KEY = "mathfr_session_consent";

function readChoice(): string | null {
  const hit = document.cookie.split("; ").find((part) => part.startsWith(`${KEY}=`));
  return hit ? decodeURIComponent(hit.split("=")[1]) : null;
}

function writeChoice(value: string) {
  const year = 60 * 60 * 24 * 365;
  document.cookie = `${KEY}=${value}; path=/; max-age=${year}; samesite=lax`;
}

export function Consent() {
  const [choice, setChoice] = useState<string | null>(() => readChoice());

  if (choice !== null) return null;

  const decide = (value: string) => {
    writeChoice(value);
    setChoice(value);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-edge bg-ground/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <p className="text-xs leading-relaxed text-muted">
          this site keeps one cookie to hold a signed-in session, and records the network address
          of each request with the page it asked for. addresses are kept for a limited period and
          then removed. the clips are played through an external player on its cookie-free domain,
          so nothing is set by it before playback starts.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="rounded border border-leaf px-3 py-1.5 font-mono text-xs text-leaf"
          >
            accept
          </button>
          <button
            type="button"
            onClick={() => decide("declined")}
            className="rounded border border-edge px-3 py-1.5 font-mono text-xs text-muted"
          >
            decline
          </button>
        </div>
      </div>
    </div>
  );
}
