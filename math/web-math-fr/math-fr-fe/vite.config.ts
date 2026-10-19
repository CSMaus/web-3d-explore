import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { kitThemePlugin } from "./scripts/kit-theme-plugin.ts";
import { palettesPlugin } from "./scripts/palettes-plugin.ts";
import { themesPlugin } from "./scripts/themes-plugin.ts";

const kitDir = fileURLToPath(new URL("../ui-kit", import.meta.url));

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    themesPlugin(fileURLToPath(new URL("./themes", import.meta.url))),
    kitThemePlugin(kitDir),
    palettesPlugin(fileURLToPath(new URL("./src/lib/palettes.own.json", import.meta.url))),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@kit": fileURLToPath(new URL("../ui-kit/src", import.meta.url)),
    },
    // the kit lives beside this project with its own node_modules; react and
    // the primitives must resolve to this project's copies, once
    dedupe: ["react", "react-dom", "radix-ui", "cn", "class-variance-authority"],
  },
  build: { chunkSizeWarningLimit: 700 },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
  },
  // the port is the preferred one; when something else holds it, vite takes the next free
  // port and prints the address it chose
  server: { port: 1263, strictPort: false, fs: { allow: [".", "../ui-kit"] } },
});
