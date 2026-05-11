// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import matter from "gray-matter";
import * as toml from "@iarna/toml";
import type { Frontmatter } from "../types.js";

const GRAY_MATTER_OPTIONS = {
  engines: { toml: (src: string) => toml.parse(src) as Record<string, unknown> },
};

export type ParsedSource<T extends Record<string, unknown>> = {
  content: string;
  frontmatter: Frontmatter<T>;
};

export function parseFrontmatter<T extends Record<string, unknown>>(
  source: string,
): ParsedSource<T> {
  const { content, data } = matter(source, GRAY_MATTER_OPTIONS);
  return {
    content,
    frontmatter: (data ?? {}) as Frontmatter<T>,
  };
}
