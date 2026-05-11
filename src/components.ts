// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
import { createElement, type ComponentType, type ReactNode } from "react";
import { Box } from "@booga/vui";

type MDXComponentProps = {
  children?: ReactNode;
  [prop: string]: unknown;
};

type MDXComponent = ComponentType<MDXComponentProps>;

function boxAs(tag: string): MDXComponent {
  return function BoundBox({ children, ...props }: MDXComponentProps) {
    return createElement(Box as ComponentType<MDXComponentProps & { as: string }>, {
      as: tag,
      ...props,
      children,
    });
  };
}

export const defaultComponents = {
  h1: boxAs("h1"),
  h2: boxAs("h2"),
  h3: boxAs("h3"),
  h4: boxAs("h4"),
  h5: boxAs("h5"),
  h6: boxAs("h6"),
  p: boxAs("p"),
  ul: boxAs("ul"),
  ol: boxAs("ol"),
  li: boxAs("li"),
  code: boxAs("code"),
  pre: boxAs("pre"),
  blockquote: boxAs("blockquote"),
  a: boxAs("a"),
} as const satisfies Record<string, MDXComponent>;
