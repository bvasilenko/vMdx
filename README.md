# vMdx

MDX compiler — build-time and dev-runtime. Frontmatter typed. Vite plugin included. Default components wired to vUi primitives.

## Install

```bash
npm install @booga/vmdx react react-dom
```

Vite plugin requires `vite` (peer, optional):

```bash
npm install -D vite
```

## Core API

```ts
import { compile, compileFile } from "@booga/vmdx";

const { code, frontmatter } = await compile("# Hello");
const { code, frontmatter } = await compileFile("./docs/intro.mdx");
```

`compile()` defaults to `function-body` output (eval-safe). Override with `outputFormat: "program"` for static import() use.

## Frontmatter

YAML and TOML supported. Missing frontmatter → `{}`.

```mdx
---
title: My Post
published: true
---

# Body
```

```ts
const { frontmatter } = await compile(source);
// frontmatter: { title: "My Post", published: true }
```

TOML via `---toml` delimiter:

```mdx
---toml
title = "TOML Post"
---
```

## Vite plugin

```ts
import { vitePlugin } from "@booga/vmdx/vite/plugin";

export default defineConfig({
  plugins: [vitePlugin()],
});
```

Transforms `.mdx` → React component module. Caches by content hash + mtime.

## Config

```ts
import { MdxConfigSchema } from "@booga/vmdx";

const config = MdxConfigSchema.parse({
  remarkPlugins: [remarkGfm],
  rehypePlugins: [],
  components: {},
  cacheDir: ".vmdx-cache",
});
```

No GFM by default. Opt in via `remarkPlugins`.

## Default components

```ts
import { defaultComponents } from "@booga/vmdx";
```

Maps `h1..h6`, `p`, `ul`, `ol`, `li`, `code`, `pre`, `blockquote`, `a` to `@booga/vui` `Box` primitives.

## Types

```ts
import type { Frontmatter, MdxConfig, CompileResult } from "@booga/vmdx";

type PostFrontmatter = Frontmatter<{ title: string; published: boolean }>;
```

## Code of conduct

[Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)

## License

MIT © 2026 bvasilenko
