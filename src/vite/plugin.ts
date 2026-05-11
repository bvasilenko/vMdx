// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { resolve } from "node:path";
import type { Plugin } from "vite";
import { MdxConfigSchema, type MdxConfig } from "../config.js";
import { DiskCache } from "../cache/index.js";
import { compile } from "../core/compile.js";

const VITE_PASSTHROUGH_QUERIES = new Set(["raw", "url"]);

function isMdxModule(id: string): boolean {
  const [path, query] = id.split("?", 2) as [string, string | undefined];
  return path.endsWith(".mdx") && !VITE_PASSTHROUGH_QUERIES.has(query ?? "");
}

export function vitePlugin(opts?: Partial<MdxConfig>): Plugin {
  const config = MdxConfigSchema.parse(opts ?? {});
  const cache = new DiskCache(config.cacheDir);

  return {
    name: "vmdx",
    enforce: "pre",

    async transform(code, id) {
      if (!isMdxModule(id)) return null;

      const abs = resolve(id.split("?")[0]);
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
