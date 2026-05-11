// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { compile as mdxCompile } from "@mdx-js/mdx";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { MdxConfigSchema, type MdxConfig } from "../config.js";
import { DiskCache } from "../cache/index.js";
import { parseFrontmatter } from "./frontmatter.js";
import type { CompileResult } from "../types.js";

export type OutputFormat = "program" | "function-body";

export type CompileOptions = Partial<MdxConfig> & {
  outputFormat?: OutputFormat;
};

export async function compile(
  source: string,
  opts?: CompileOptions,
): Promise<CompileResult> {
  const { outputFormat = "function-body", ...configOpts } = opts ?? {};
  const config = MdxConfigSchema.parse(configOpts);
  const { content, frontmatter } = parseFrontmatter(source);

  const vfile = await mdxCompile(content, {
    outputFormat,
    remarkPlugins: config.remarkPlugins as never[],
    rehypePlugins: config.rehypePlugins as never[],
  });

  return { code: String(vfile), frontmatter };
}

export async function compileFile(
  filePath: string,
  opts?: CompileOptions,
): Promise<CompileResult> {
  const { outputFormat = "function-body", ...configOpts } = opts ?? {};
  const config = MdxConfigSchema.parse(configOpts);
  const abs = resolve(filePath);
  const source = await readFile(abs, "utf8");

  const cache = new DiskCache(config.cacheDir);
  const cached = cache.get(abs, source);
  if (cached) return cached;

  const result = await compile(source, { ...configOpts, outputFormat });
  cache.set(abs, source, result);
  return result;
}
