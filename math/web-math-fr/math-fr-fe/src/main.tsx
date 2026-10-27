import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyMode, applyPalette, KIT_CASE, kitTheme, readMode } from "@kit/index";
import { routeTree } from "@/routeTree.gen";
import "@/styles.css";
import "@/i18n";
import { DARK_ONLY } from "@/lib/site";

// the theme in force (the visitor's choice when it is one the product ships), which the sheet follows
document.documentElement.dataset.case = KIT_CASE;
// a case whose fonts come from another server brings them itself, so no other case loads them
for (const href of kitTheme.type.imports ?? []) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}
applyMode(DARK_ONLY.includes(KIT_CASE) ? "dark" : readMode(kitTheme.colours.default));
if (kitTheme.palettes && kitTheme.palette) applyPalette(kitTheme.palette);

// the site can live under a path, as on GitHub Pages (/web-3d-explore/); vite's base, set by
// VITE_BASE at build time, is the router's base too
const router = createRouter({ routeTree, defaultPreload: "intent", basepath: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
