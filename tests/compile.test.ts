// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { compile, compileFile } from "../src/core/compile.js";
import type { CompileResult } from "../src/types.js";

const TABLE_MARKDOWN = "| col1 | col2 |\n|------|------|\n| a    | b    |";

describe("compile — function-body output shape", () => {
  let result: CompileResult;

  beforeAll(async () => {
    result = await compile("# Hello");
  });

  it("code is a non-empty string", () => {
    expect(result.code).toBeTypeOf("string");
    expect(result.code.length).toBeGreaterThan(0);
  });

  it("code contains MDXContent function definition", () => {
    expect(result.code).toContain("MDXContent");
  });

  it("code has no top-level import statements (eval-safe)", () => {
    expect(result.code).not.toMatch(/^import\s/m);
  });

  it("code contains a return statement (function-body contract)", () => {
    expect(result.code).toContain("return");
  });

  it("frontmatter is an empty object when source has none", () => {
    expect(result.frontmatter).toEqual({});
  });
});

describe("compile — program output format", () => {
  let code: string;

  beforeAll(async () => {
    ({ code } = await compile("# Hello", { outputFormat: "program" }));
  });

  it("code has top-level export default", () => {
    expect(code).toMatch(/export default/);
  });

  it("code contains jsx runtime calls", () => {
    expect(code).toContain("jsx");
  });

  it("code does not contain function-body return pattern", () => {
    expect(code).not.toMatch(/^return\s/m);
  });

  it("returns non-empty frontmatter alongside program-format code", async () => {
    const { code: progCode, frontmatter } = await compile("---\ntitle: ProgramFM\n---\n# Body", { outputFormat: "program" });
    expect(frontmatter).toMatchObject({ title: "ProgramFM" });
    expect(progCode).toMatch(/export default/);
  });
});

describe("compile — frontmatter extraction", () => {
  it("YAML frontmatter is parsed and stripped from compilation input", async () => {
    const source = "---\ntitle: Hello\nauthor: bvasilenko\n---\n# Body";
    const { frontmatter } = await compile(source);
    expect(frontmatter).toMatchObject({ title: "Hello", author: "bvasilenko" });
  });

  it("TOML frontmatter is parsed via the ---toml delimiter", async () => {
    const source = '---toml\ntitle = "TOML via compile"\ncount = 7\n---\n# Body';
    const { frontmatter } = await compile(source);
    expect(frontmatter).toMatchObject({ title: "TOML via compile", count: 7 });
  });

  it("missing frontmatter returns an empty object", async () => {
    const { frontmatter } = await compile("just text, no delimiters");
    expect(frontmatter).toEqual({});
  });
});

describe("compile — source edge cases", () => {
  it("compiles empty string source without throwing", async () => {
    const { code, frontmatter } = await compile("");
    expect(typeof code).toBe("string");
    expect(frontmatter).toEqual({});
  });

  it("compiles whitespace-only source without throwing", async () => {
    const { code } = await compile("   \n\t  ");
    expect(typeof code).toBe("string");
    expect(code.length).toBeGreaterThan(0);
  });

  it("compiles source containing only frontmatter with no body", async () => {
    const { frontmatter } = await compile("---\ntitle: FM Only\n---\n");
    expect(frontmatter).toMatchObject({ title: "FM Only" });
  });

  it("compiles inline JSX expressions embedded in markdown", async () => {
    const { code } = await compile("Result: {1 + 1}");
    expect(code).toContain("MDXContent");
  });
});

describe("compile — GFM extension behavior", () => {
  it("does not process GFM table syntax without remarkPlugins", async () => {
    const { code } = await compile(TABLE_MARKDOWN);
    expect(code).not.toMatch(/"table"/);
  });

  it("processes GFM table syntax when remark-gfm is passed via remarkPlugins", async () => {
    const remarkGfm = (await import("remark-gfm")).default;
    const { code } = await compile(TABLE_MARKDOWN, { remarkPlugins: [remarkGfm] });
    expect(code).toMatch(/"table"/);
  });
});

describe("compile — config validation", () => {
  it("rejects unknown config keys before compilation (strict schema)", async () => {
    await expect(compile("# Hi", { unknownKey: true } as never)).rejects.toThrow();
  });

  it("accepts explicit undefined opts identically to no opts", async () => {
    const { code, frontmatter } = await compile("# Hi", undefined);
    expect(typeof code).toBe("string");
    expect(frontmatter).toEqual({});
  });

  it("accepts explicit outputFormat: 'function-body' and produces function-body output", async () => {
    const { code } = await compile("# Explicit format", { outputFormat: "function-body" });
    expect(code).toContain("return");
    expect(code).not.toMatch(/^import\s/m);
  });
});

describe("compile — rehypePlugins passthrough", () => {
  it("does not inject sentinel attribute without a rehype plugin", async () => {
    const { code } = await compile("# Heading");
    expect(code).not.toContain("data-vmdx-sentinel");
  });

  it("applies a custom rehype plugin to the compiled output", async () => {
    function sentinelPlugin() {
      return function (tree: { children: Array<{ type: string; tagName?: string; properties?: Record<string, unknown> }> }) {
        for (const node of tree.children) {
          if (node.type === "element" && node.tagName?.startsWith("h")) {
            node.properties = { ...node.properties, "data-vmdx-sentinel": "1" };
          }
        }
      };
    }
    const { code } = await compile("# My Heading", { rehypePlugins: [sentinelPlugin] });
    expect(code).toContain("data-vmdx-sentinel");
  });
});

let compileTmpDir: string;

beforeEach(() => {
  compileTmpDir = join(tmpdir(), `vmdx-compile-test-${Date.now()}`);
  mkdirSync(compileTmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(compileTmpDir, { recursive: true, force: true });
});

describe("compileFile — output format variants", () => {
  it("returns function-body format by default (no outputFormat option)", async () => {
    const filePath = join(compileTmpDir, "default.mdx");
    const cacheDir = join(compileTmpDir, "cache");
    writeFileSync(filePath, "# Default format");
    const { code } = await compileFile(filePath, { cacheDir });
    expect(code).toContain("return");
    expect(code).not.toMatch(/^import\s/m);
  });

  it("returns program format when outputFormat: 'program' is specified", async () => {
    const filePath = join(compileTmpDir, "program.mdx");
    const cacheDir = join(compileTmpDir, "cache");
    writeFileSync(filePath, "# Program format");
    const { code } = await compileFile(filePath, { cacheDir, outputFormat: "program" });
    expect(code).toMatch(/export default/);
    expect(code).not.toMatch(/^return\s/m);
  });

  it("frontmatter is extracted and returned from compileFile", async () => {
    const filePath = join(compileTmpDir, "fm.mdx");
    const cacheDir = join(compileTmpDir, "cache");
    writeFileSync(filePath, "---\ntitle: File FM\nauthor: bvasilenko\n---\n# Body");
    const { frontmatter } = await compileFile(filePath, { cacheDir });
    expect(frontmatter).toMatchObject({ title: "File FM", author: "bvasilenko" });
  });

  it("rejects unknown config keys passed to compileFile", async () => {
    const filePath = join(compileTmpDir, "strict.mdx");
    writeFileSync(filePath, "# Strict");
    await expect(
      compileFile(filePath, { unknownKey: true } as never),
    ).rejects.toThrow();
  });

  it("compileFile without opts resolves using all default settings", async () => {
    const filePath = join(compileTmpDir, "no-opts.mdx");
    writeFileSync(filePath, "# No opts");
    const { code, frontmatter } = await compileFile(filePath);
    expect(code).toContain("MDXContent");
    expect(frontmatter).toEqual({});
  });
});

describe("compileFile — error paths", () => {
  it("rejects when the referenced file does not exist", async () => {
    const nonExistent = join(compileTmpDir, "does-not-exist.mdx");
    await expect(compileFile(nonExistent)).rejects.toThrow();
  });
});
