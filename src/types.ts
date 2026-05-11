// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

export type Frontmatter<T = Record<string, unknown>> = T;

export type CompileResult = {
  code: string;
  frontmatter: Frontmatter;
};
