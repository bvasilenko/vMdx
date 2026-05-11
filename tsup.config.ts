import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "vite/plugin": "src/vite/plugin.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  external: ["react", "react-dom", "vite"],
  clean: true,
});
