// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { describe, it, expect } from "vitest";
import * as API from "../src/index.js";

const FUNCTION_EXPORTS = ["compile", "compileFile", "vitePlugin"] as const;

const DEFAULT_COMPONENT_KEYS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "ul", "ol", "li", "code", "pre", "blockquote", "a",
] as const;

describe("barrel — callable function exports (spec §3.1)", () => {
  it.each(FUNCTION_EXPORTS)("'%s' is exported as a function", (name) => {
    expect(typeof API[name]).toBe("function");
  });
});

describe("barrel — schema export (spec §3.1)", () => {
  it("MdxConfigSchema is exported as a parseable zod schema", () => {
    expect(typeof API.MdxConfigSchema).toBe("object");
    expect(typeof API.MdxConfigSchema.parse).toBe("function");
  });

  it("MdxConfigSchema.parse accepts an empty object and applies defaults", () => {
    const result = API.MdxConfigSchema.parse({});
    expect(result).toMatchObject({
      remarkPlugins: [],
      rehypePlugins: [],
      components: {},
      cacheDir: ".vmdx-cache",
    });
  });
});

describe("barrel — defaultComponents export (spec §3.1)", () => {
  it("defaultComponents is exported as an object", () => {
    expect(typeof API.defaultComponents).toBe("object");
    expect(API.defaultComponents).not.toBeNull();
  });

  it.each(DEFAULT_COMPONENT_KEYS)("'%s' key is a callable component function", (key) => {
    expect(typeof API.defaultComponents[key]).toBe("function");
  });
});
