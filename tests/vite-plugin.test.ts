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

describe("vitePlugin — transform filter", () => {
  it("returns null for .md files (only .mdx is transformed)", async () => {
    const transform = vitePlugin().transform as TransformFn;
    expect(await transform("# hello", "/path/to/file.md")).toBeNull();
  });

  it("returns null for .ts files", async () => {
    const transform = vitePlugin().transform as TransformFn;
    expect(await transform("const x = 1;", "/path/to/file.ts")).toBeNull();
  });

  it("returns a transform result for .mdx files", async () => {
    const transform = vitePlugin().transform as TransformFn;
    const result = await transform("# Hello", "/path/to/file.mdx");
    expect(result).not.toBeNull();
    expect(result?.code).toContain("MDXContent");
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
