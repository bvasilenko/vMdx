# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-11

### Added

- `compile(source, opts?)` — MDX → ESM string + typed frontmatter
- `compileFile(path, opts?)` — file convenience wrapper with disk cache
- `vitePlugin(opts?)` — Vite plugin; transforms `.mdx` files; mtime+hash cache
- `MdxConfigSchema` — zod strict schema; `remarkPlugins`, `rehypePlugins`, `components`, `cacheDir`
- `Frontmatter<T>` generic type
- `defaultComponents` — `h1..h6`, `p`, `ul`, `ol`, `li`, `code`, `pre`, `blockquote`, `a` wired to `@booga/vui` Box
- YAML and TOML frontmatter support via gray-matter + @iarna/toml
- `function-body` output format default; `program` format opt-in
- No GFM by default; opt-in via `remarkPlugins`
- Dual build entries: `core` and `vite/plugin`
