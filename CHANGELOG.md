# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] — 2026-05-18

### Changed

- `@booga/vui` dependency raised from `^0.1.0` to `^0.3.1`. vUi 0.1.0 predates
  the vTheme semantic color-role contract (0.2.0) and the corrected type scale
  (0.3.1); the `defaultComponents` Box wiring now renders through current vUi.

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
