import { describe, it, expect } from "vitest";
import { MdxConfigSchema } from "../src/config.js";

describe("MdxConfigSchema — unknown field rejection", () => {
  it("rejects a single unknown field", () => {
    expect(() => MdxConfigSchema.parse({ unknownField: true })).toThrow();
  });

  it("rejects unknown fields alongside valid fields", () => {
    expect(() => MdxConfigSchema.parse({ cacheDir: ".cache", extra: 1 })).toThrow();
  });
});

describe("MdxConfigSchema — invalid types for valid fields", () => {
  it.each([
    ["remarkPlugins", "not-an-array"],
    ["rehypePlugins", 42],
    ["cacheDir", false],
    ["components", 99],
  ] as const)("rejects invalid type for '%s' field", (field, value) => {
    expect(() => MdxConfigSchema.parse({ [field]: value })).toThrow();
  });
});

describe("MdxConfigSchema — null and undefined inputs", () => {
  it("rejects null as input", () => {
    expect(() => MdxConfigSchema.parse(null)).toThrow();
  });

  it("rejects undefined as input", () => {
    expect(() => MdxConfigSchema.parse(undefined)).toThrow();
  });
});

describe("MdxConfigSchema — valid inputs", () => {
  it("accepts all four valid fields simultaneously", () => {
    const result = MdxConfigSchema.parse({
      remarkPlugins: [],
      rehypePlugins: [],
      components: { custom: {} },
      cacheDir: ".custom-cache",
    });
    expect(result.cacheDir).toBe(".custom-cache");
    expect(result.components).toEqual({ custom: {} });
  });

  it("applies all defaults when given an empty object", () => {
    const result = MdxConfigSchema.parse({});
    expect(result.remarkPlugins).toEqual([]);
    expect(result.rehypePlugins).toEqual([]);
    expect(result.components).toEqual({});
    expect(result.cacheDir).toBe(".vmdx-cache");
  });

  it("applies remaining defaults when only some fields are provided", () => {
    const result = MdxConfigSchema.parse({ cacheDir: ".alt" });
    expect(result.cacheDir).toBe(".alt");
    expect(result.remarkPlugins).toEqual([]);
    expect(result.rehypePlugins).toEqual([]);
    expect(result.components).toEqual({});
  });

  it("accepts non-empty remarkPlugins and rehypePlugins arrays", () => {
    const fakePlugin = () => ({});
    const result = MdxConfigSchema.parse({
      remarkPlugins: [fakePlugin],
      rehypePlugins: [fakePlugin],
    });
    expect(result.remarkPlugins).toHaveLength(1);
    expect(result.rehypePlugins).toHaveLength(1);
  });
});
