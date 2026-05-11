
export type Frontmatter<T = Record<string, unknown>> = T;

export type CompileResult = {
  code: string;
  frontmatter: Frontmatter;
};
