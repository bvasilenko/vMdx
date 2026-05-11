import { z } from "zod";

export const MdxConfigSchema = z
  .object({
    remarkPlugins: z.array(z.unknown()).default([]),
    rehypePlugins: z.array(z.unknown()).default([]),
    components: z.record(z.unknown()).default({}),
    cacheDir: z.string().default(".vmdx-cache"),
  })
  .strict();

export type MdxConfig = z.infer<typeof MdxConfigSchema>;
