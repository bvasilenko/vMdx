// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { build, type Rollup } from "vite";
type RollupOutput = Rollup.RollupOutput;
import { vitePlugin } from "../src/vite/plugin.js";

type TransformFn = (code: string, id: string) => Promise<{ code: string; map: null } | null>;

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `vmdx-vite-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

async function buildMdx(
  mdxSource: string,
  opts?: Parameters<typeof vitePlugin>[0],
  fileName = "entry.mdx",
): Promise<RollupOutput> {
  const entryPath = join(tmpDir, fileName);
  writeFileSync(entryPath, mdxSource);

  const raw = await build({
    root: tmpDir,
    logLevel: "silent",
    plugins: [vitePlugin(opts)],
    build: {
      write: false,
      lib: {
        entry: entryPath,
        formats: ["es"],
        fileName: "entry",
      },
      rollupOptions: {
        external: ["react", "react/jsx-runtime"],
      },
    },
  });

  return (Array.isArray(raw) ? raw[0] : raw) as RollupOutput;
}

function chunkCode(output: RollupOutput): string {
  const chunk = output.output[0];
  return "code" in chunk ? chunk.code : "";
}

describe("vitePlugin — plugin metadata", () => {
  it("plugin name is vmdx", () => {
    expect(vitePlugin().name).toBe("vmdx");
  });

  it("plugin enforce is pre", () => {
    expect(vitePlugin().enforce).toBe("pre");
  });
});

const TRANSFORM_IDS = [
  "/path/to/file.mdx",
  "/path/to/file.mdx?t=12345",
  "/path/to/file.mdx?t=1&v=2",
  "/path/to/file.mdx?",
  "/path/to/file.mdx?raw=1",
] as const;

const SKIP_IDS = [
  "/path/to/file.md",
  "/path/to/file.ts",
  "/path/to/file.tsx",
  "/path/to/file.js",
  "/path/to/file.mdxc",
  "/path/to/file.MDX",
  "/path/to/file.mdx?raw",
  "/path/to/file.mdx?url",
] as const;

describe("vitePlugin — transform filter", () => {
  it.each(TRANSFORM_IDS)("transforms %s", async (id) => {
    const transform = vitePlugin().transform as TransformFn;
    expect(await transform("# hello", id)).not.toBeNull();
  });

  it.each(SKIP_IDS)("returns null for %s", async (id) => {
    const transform = vitePlugin().transform as TransformFn;
    expect(await transform("# hello", id)).toBeNull();
  });

  it("transform output contains compiled code and no source map", async () => {
    const transform = vitePlugin().transform as TransformFn;
    const result = await transform("# Hello", "/path/to/file.mdx");
    expect(result?.code).toContain("MDXContent");
    expect(result?.map).toBeNull();
  });
});

describe("vitePlugin — vite build integration", () => {
  it("produces non-empty output for a minimal MDX file", async () => {
    const result = await buildMdx("# Hello from MDX");
    expect(result.output.length).toBeGreaterThan(0);
    expect(result.output[0].type).toBe("chunk");
  });

  it("compiled output is a valid ES module with a default export", async () => {
    const code = chunkCode(await buildMdx("# Heading\n\nParagraph."));
    expect(code).toMatch(/export\s*\{/);
    expect(code).toMatch(/export\s*\{[^}]*default/);
  });

  it("MDX body content appears in compiled output", async () => {
    const code = chunkCode(await buildMdx("# Unique-marker-1a2b3c"));
    expect(code).toContain("Unique-marker-1a2b3c");
  });

  it("compiled output contains jsx runtime calls", async () => {
    const code = chunkCode(await buildMdx("# Hello"));
    expect(code).toContain("jsx");
  });

  it("empty MDX content compiles to a valid module", async () => {
    const code = chunkCode(await buildMdx(""));
    expect(code).toMatch(/export\s*\{/);
  });
});

describe("vitePlugin — cache behavior", () => {
  it("two builds of identical content produce byte-equal chunks", async () => {
    const source = "# Cached\n\nContent here.";
    const cacheDir = join(tmpDir, "cache");

    const code1 = chunkCode(await buildMdx(source, { cacheDir }));
    const code2 = chunkCode(await buildMdx(source, { cacheDir }));

    expect(code1).toBe(code2);
  });
});

describe("vitePlugin — plugin options passthrough", () => {
  it("forwards remarkPlugins to the compiler (GFM table support)", async () => {
    const remarkGfm = (await import("remark-gfm")).default;
    const tableSource = "| a | b |\n|---|---|\n| 1 | 2 |";
    const cacheDir = join(tmpDir, "cache-gfm");
    const code = chunkCode(await buildMdx(tableSource, { remarkPlugins: [remarkGfm], cacheDir }));
    expect(code).toMatch(/"table"/);
  });

  it("compiles without GFM table support when no remarkPlugins are provided", async () => {
    const tableSource = "| a | b |\n|---|---|\n| 1 | 2 |";
    const cacheDir = join(tmpDir, "cache-no-gfm");
    const code = chunkCode(await buildMdx(tableSource, { cacheDir }));
    expect(code).not.toMatch(/"table"/);
  });

  it("uses the specified cacheDir for cache storage", async () => {
    const { readdirSync, existsSync } = await import("node:fs");
    const cacheDir = join(tmpDir, "custom-cache-dir");
    await buildMdx("# Custom cache", { cacheDir });
    expect(existsSync(cacheDir)).toBe(true);
    expect(readdirSync(cacheDir).filter((f) => f.endsWith(".json")).length).toBeGreaterThan(0);
  });
});


describe("vitePlugin — schema validation", () => {
  it("throws synchronously when an unknown option key is passed", () => {
    expect(() => vitePlugin({ unknownKey: true } as never)).toThrow();
  });
});