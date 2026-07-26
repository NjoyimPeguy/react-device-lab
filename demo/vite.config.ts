import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const fromDemo = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: fromDemo("./"),
  plugins: [react()],
  build: {
    outDir: fromDemo("../demo-dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: fromDemo("./index.html"),
        preview: fromDemo("./preview/index.html"),
      },
    },
  },
});
