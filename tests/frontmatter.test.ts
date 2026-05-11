// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../src/core/frontmatter.js";

describe("parseFrontmatter — sources without frontmatter", () => {
  it("returns empty frontmatter and unchanged content for plain markdown", () => {
    const { frontmatter, content } = parseFrontmatter("# Hello");
    expect(frontmatter).toEqual({});
    expect(content.trim()).toBe("# Hello");
  });

  it("returns empty frontmatter and empty content for empty string", () => {
    const { frontmatter, content } = parseFrontmatter("");
    expect(frontmatter).toEqual({});
    expect(content).toBe("");
  });

  it("returns empty frontmatter for whitespace-only source", () => {
    const { frontmatter } = parseFrontmatter("   \n  ");
    expect(frontmatter).toEqual({});
  });

  it("treats --- in the body (not at the start) as literal text, not a delimiter", () => {
    const source = "# Title\n\nSome text --- with dashes --- in it";
    const { frontmatter, content } = parseFrontmatter(source);
    expect(frontmatter).toEqual({});
    expect(content).toContain("---");
  });
});

describe("parseFrontmatter — YAML frontmatter", () => {
  it("parses YAML string values and strips them from content", () => {
    const source = "---\ntitle: My Post\nauthor: bvasilenko\n---\n# Body";
    const { frontmatter, content } = parseFrontmatter(source);
    expect(frontmatter).toMatchObject({ title: "My Post", author: "bvasilenko" });
    expect(content.trim()).toBe("# Body");
  });

  it("parses YAML boolean, number, and null scalar types", () => {
    const source = "---\npublished: true\ncount: 42\npriority: null\n---\ncontent";
    const { frontmatter } = parseFrontmatter(source);
    expect(frontmatter).toMatchObject({ published: true, count: 42, priority: null });
  });

  it("parses YAML nested objects", () => {
    const source = "---\nmeta:\n  author: bvasilenko\n  tags:\n    - mdx\n    - react\n---\ncontent";
    const { frontmatter } = parseFrontmatter(source);
    expect(frontmatter).toMatchObject({
      meta: { author: "bvasilenko", tags: ["mdx", "react"] },
    });
  });

  it("parses YAML array at the top level", () => {
    const source = "---\ntags:\n  - mdx\n  - vite\n  - react\n---\ncontent";
    const { frontmatter } = parseFrontmatter(source);
    expect(frontmatter).toMatchObject({ tags: ["mdx", "vite", "react"] });
  });

  it("returns empty object for an empty frontmatter block (---/---)", () => {
    const { frontmatter } = parseFrontmatter("---\n---\n# After");
    expect(frontmatter).toEqual({});
  });

  it("returns frontmatter correctly when body is empty after delimiter", () => {
    const { frontmatter, content } = parseFrontmatter("---\ntitle: Only FM\n---\n");
    expect(frontmatter).toMatchObject({ title: "Only FM" });
    expect(content.trim()).toBe("");
  });
});

describe("parseFrontmatter — YAML null-valued and comment-only frontmatter blocks", () => {
  it("YAML null keyword at document root returns empty frontmatter and preserves body content", () => {
    const source = "---\nnull\n---\nbody";
    const { frontmatter, content } = parseFrontmatter(source);
    expect(frontmatter).toEqual({});
    expect(content.trim()).toBe("body");
  });

  it("YAML tilde null alias at document root returns empty frontmatter and preserves body content", () => {
    const source = "---\n~\n---\nbody";
    const { frontmatter, content } = parseFrontmatter(source);
    expect(frontmatter).toEqual({});
    expect(content.trim()).toBe("body");
  });

  it("YAML comment-only frontmatter block returns empty frontmatter and preserves body content", () => {
    const source = "---\n# metadata intentionally cleared\n---\nbody";
    const { frontmatter, content } = parseFrontmatter(source);
    expect(frontmatter).toEqual({});
    expect(content.trim()).toBe("body");
  });
});

describe("parseFrontmatter — TOML frontmatter", () => {
  it("parses TOML string and number values via the ---toml delimiter", () => {
    const source = '---toml\ntitle = "TOML Post"\ncount = 42\n---\nbody text';
    const { frontmatter, content } = parseFrontmatter(source);
    expect(frontmatter).toMatchObject({ title: "TOML Post", count: 42 });
    expect(content.trim()).toBe("body text");
  });

  it("parses TOML boolean and array values", () => {
    const source = '---toml\npublished = true\ntags = ["mdx", "toml"]\n---\n';
    const { frontmatter } = parseFrontmatter(source);
    expect(frontmatter).toMatchObject({ published: true, tags: ["mdx", "toml"] });
  });

  it("parses TOML nested tables", () => {
    const source = '---toml\n[meta]\nauthor = "bvasilenko"\n[meta.links]\nhome = "https://example.com"\n---\nbody';
    const { frontmatter } = parseFrontmatter(source);
    expect(frontmatter).toMatchObject({
      meta: { author: "bvasilenko", links: { home: "https://example.com" } },
    });
  });
});

describe("parseFrontmatter — type coercion behavior", () => {
  it("coerces ISO 8601 date strings in YAML to Date objects", () => {
    const source = "---\ndate: 2026-01-15\n---\nbody";
    const { frontmatter } = parseFrontmatter(source);
    expect(frontmatter.date).toBeInstanceOf(Date);
    expect((frontmatter.date as Date).toISOString()).toMatch(/^2026-01-15/);
  });

  it("preserves Unicode string values in YAML without corruption", () => {
    const source = "---\ntitle: 日本語テスト\nauthor: бвасіленко\n---\nbody";
    const { frontmatter } = parseFrontmatter(source);
    expect(frontmatter).toMatchObject({ title: "日本語テスト", author: "бвасіленко" });
  });

  it("preserves Unicode string values in TOML without corruption", () => {
    const source = '---toml\ntitle = "日本語テスト"\n---\nbody';
    const { frontmatter } = parseFrontmatter(source);
    expect(frontmatter).toMatchObject({ title: "日本語テスト" });
  });
});

describe("parseFrontmatter — malformed frontmatter", () => {
  it("throws a parse error for malformed YAML frontmatter", () => {
    expect(() => parseFrontmatter("---\n: bad: yaml:\n---\nbody")).toThrow();
  });

  it("throws a parse error for malformed TOML frontmatter", () => {
    expect(() => parseFrontmatter("---toml\n[invalid = broken syntax\n---\nbody")).toThrow();
  });
});
