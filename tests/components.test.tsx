// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { defaultComponents } from "../src/components.js";

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
const BLOCK_TAGS = ["p", "ul", "ol", "li", "code", "pre", "blockquote", "a"] as const;
const ALL_REQUIRED_KEYS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "ul", "ol", "li", "code", "pre", "blockquote", "a",
] as const;

describe("defaultComponents — heading elements", () => {
  it.each(HEADING_LEVELS)("h%i renders the correct HTML heading element", (level) => {
    const key = `h${level}` as keyof typeof defaultComponents;
    const Component = defaultComponents[key];
    const { container } = render(<Component>heading text</Component>);
    expect(container.querySelector(`h${level}`)).toBeTruthy();
  });
});

describe("defaultComponents — block elements", () => {
  it.each(BLOCK_TAGS)("%s renders the correct HTML block element", (tag) => {
    const Component = defaultComponents[tag];
    const { container } = render(<Component>block content</Component>);
    expect(container.querySelector(tag)).toBeTruthy();
  });
});

describe("defaultComponents — public API shape (spec §3.1)", () => {
  it.each(ALL_REQUIRED_KEYS)("'%s' is exported as a callable component", (key) => {
    expect(typeof defaultComponents[key]).toBe("function");
  });
});

describe("defaultComponents — children propagation", () => {
  it("renders text children inside the element", () => {
    const { getByText } = render(<defaultComponents.p>hello world</defaultComponents.p>);
    expect(getByText("hello world")).toBeTruthy();
  });

  it("renders nested element children correctly", () => {
    const { getByText } = render(
      <defaultComponents.ul>
        <li>list item</li>
      </defaultComponents.ul>,
    );
    expect(getByText("list item")).toBeTruthy();
  });

  it("renders without crashing when children is omitted", () => {
    expect(() => render(<defaultComponents.p />)).not.toThrow();
  });
});

describe("defaultComponents — prop forwarding", () => {
  it("forwards className to the rendered HTML element", () => {
    const { container } = render(
      <defaultComponents.p className="my-class">text</defaultComponents.p>,
    );
    expect(container.querySelector("p.my-class")).toBeTruthy();
  });

  it("forwards id attribute to the rendered HTML element", () => {
    const { container } = render(
      <defaultComponents.h1 id="section-title">heading</defaultComponents.h1>,
    );
    expect(container.querySelector("#section-title")).toBeTruthy();
  });

  it("forwards data-* attributes to the rendered HTML element", () => {
    const { container } = render(
      <defaultComponents.p data-testid="my-para">text</defaultComponents.p>,
    );
    expect(container.querySelector('[data-testid="my-para"]')).toBeTruthy();
  });
});
