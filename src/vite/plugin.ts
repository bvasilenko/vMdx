import { resolve } from "node:path";
import type { Plugin } from "vite";
import { MdxConfigSchema, type MdxConfig } from "../config.js";
import { DiskCache } from "../cache/index.js";
import { compile } from "../core/compile.js";

export function vitePlugin(opts?: Partial<MdxConfig>): Plugin {
  const config = MdxConfigSchema.parse(opts ?? {});
  const cache = new DiskCache(config.cacheDir);

  return {
    name: "vmdx",
    enforce: "pre",

    async transform(code, id) {
      if (!id.endsWith(".mdx")) return null;

      const abs = resolve(id);
      const cached = cache.get(abs, code);
      if (cached) return { code: cached.code, map: null };

      const result = await compile(code, {
        ...config,
        outputFormat: "program",
      });

      cache.set(abs, code, result);
      return { code: result.code, map: null };
    },
  };
}
