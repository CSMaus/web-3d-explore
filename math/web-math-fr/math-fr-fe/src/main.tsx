import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyMode, applyPalette, kitTheme, readMode } from "@kit/index";
import { routeTree } from "@/routeTree.gen";
import "@/styles.css";
import "@/i18n";

applyMode(readMode(kitTheme.colours.default));
if (kitTheme.palettes && kitTheme.palette) applyPalette(kitTheme.palette);

const router = createRouter({ routeTree, defaultPreload: "intent" });

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
