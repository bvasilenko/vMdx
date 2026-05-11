import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DiskCache } from "../src/cache/index.js";
import { compileFile } from "../src/core/compile.js";
import type { CompileResult } from "../src/types.js";

const MOCK_RESULT: CompileResult = {
  code: 'const x = 1; return { default: function MDXContent(){} }',
  frontmatter: { title: "cached" },
};

function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 24);
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `vmdx-cache-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("DiskCache — construction", () => {
  it("creates cacheDir on disk when constructed", () => {
    const cacheDir = join(tmpDir, "auto-created");
    expect(existsSync(cacheDir)).toBe(false);
    new DiskCache(cacheDir);
    expect(existsSync(cacheDir)).toBe(true);
  });

  it("succeeds when cacheDir already exists", () => {
    const cacheDir = join(tmpDir, "pre-existing");
    mkdirSync(cacheDir, { recursive: true });
    expect(() => new DiskCache(cacheDir)).not.toThrow();
  });
});

describe("DiskCache — get/set contract", () => {
  it("returns null on cache miss (empty cache)", () => {
    const cache = new DiskCache(join(tmpDir, "cache"));
    expect(cache.get("/some/file.mdx", "content")).toBeNull();
  });

  it("returns stored result on cache hit (same path + same content)", () => {
    const cache = new DiskCache(join(tmpDir, "cache"));
    cache.set("/file.mdx", "content", MOCK_RESULT);
    expect(cache.get("/file.mdx", "content")).toEqual(MOCK_RESULT);
  });

  it("stored result is byte-equal to retrieved result", () => {
    const cache = new DiskCache(join(tmpDir, "cache"));
    cache.set("/file.mdx", "hello", MOCK_RESULT);
    const retrieved = cache.get("/file.mdx", "hello");
    expect(retrieved?.code).toBe(MOCK_RESULT.code);
    expect(retrieved?.frontmatter).toEqual(MOCK_RESULT.frontmatter);
  });

  it("returns null when content differs (different hash key)", () => {
    const cache = new DiskCache(join(tmpDir, "cache"));
    cache.set("/file.mdx", "original content", MOCK_RESULT);
    expect(cache.get("/file.mdx", "different content")).toBeNull();
  });

  it("returns null when path differs but content is identical", () => {
    const cache = new DiskCache(join(tmpDir, "cache"));
    cache.set("/path/a.mdx", "content", MOCK_RESULT);
    expect(cache.get("/path/b.mdx", "content")).toBeNull();
  });

  it("second set for the same content overwrites the entry", () => {
    const cache = new DiskCache(join(tmpDir, "cache"));
    const resultV1: CompileResult = { code: "v1", frontmatter: {} };
    const resultV2: CompileResult = { code: "v2", frontmatter: { updated: true } };
    cache.set("/file.mdx", "content", resultV1);
    cache.set("/file.mdx", "content", resultV2);
    expect(cache.get("/file.mdx", "content")).toEqual(resultV2);
  });
});

describe("DiskCache — resilience", () => {
  it("returns null for a corrupted (invalid JSON) cache entry", () => {
    const cacheDir = join(tmpDir, "cache");
    const cache = new DiskCache(cacheDir);
    const hash = contentHash("poisoned-content");
    writeFileSync(join(cacheDir, `${hash}.json`), "NOT_VALID_JSON{{{{");
    expect(cache.get("/file.mdx", "poisoned-content")).toBeNull();
  });
});

describe("compileFile — cache integration", () => {
  it("second compile of unchanged file returns byte-equal result", async () => {
    const filePath = join(tmpDir, "test.mdx");
    const cacheDir = join(tmpDir, "cache");
    writeFileSync(filePath, "# Cache test\n\nParagraph.");

    const first = await compileFile(filePath, { cacheDir });
    const second = await compileFile(filePath, { cacheDir });

    expect(first.code).toBe(second.code);
    expect(first.frontmatter).toEqual(second.frontmatter);
  });

  it("recompiles when file content changes", async () => {
    const filePath = join(tmpDir, "changing.mdx");
    const cacheDir = join(tmpDir, "cache");

    writeFileSync(filePath, "# Version one");
    const r1 = await compileFile(filePath, { cacheDir });

    writeFileSync(filePath, "# Version two — distinct content");
    const r2 = await compileFile(filePath, { cacheDir });

    expect(r1.code).not.toBe(r2.code);
  });

  it("creates cache entries on disk after first compile", async () => {
    const filePath = join(tmpDir, "cached.mdx");
    const cacheDir = join(tmpDir, "cache");
    writeFileSync(filePath, "# Cached");

    await compileFile(filePath, { cacheDir });

    const files = readdirSync(cacheDir);
    expect(files.filter((f) => f.endsWith(".json")).length).toBeGreaterThan(0);
  });
});
