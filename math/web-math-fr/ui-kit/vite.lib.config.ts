import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// the library build of the kit (npm run package): one es module from src/index.ts, with
// react, the primitives and the fonts left to the consuming project. the case the bundle
// carries is VITE_KIT_CASE, set by build/package.ts.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    lib: { entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)), formats: ["es"], fileName: "index" },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/, "radix-ui", "cn", "class-variance-authority", "lucide-react", /^@fontsource/],
    },
  },
});
