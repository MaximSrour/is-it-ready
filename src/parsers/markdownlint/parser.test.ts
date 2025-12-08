import { describe, expect, it } from "vitest";

import { type ParserFunction, getParser } from "..";
import "./parser";

const resolveParser = (name: string): ParserFunction => {
  const parser = getParser(name);

  if (!parser) {
    throw new Error(`Parser "${name}" not registered`);
  }

  return parser;
};

const parseMarkdownLint = resolveParser("MarkdownLint");

describe("parseMarkdownLint", () => {
  it("parses linting and error summary", () => {
    const output = ["Linting: 2 file(s)", "Summary: 3 error(s)"].join("\n");
    expect(parseMarkdownLint(output)).toEqual({
      message: "Failed - 3 errors",
      errors: 3,
    });
  });

  it("parses error summary without linting line", () => {
    const output = "Summary: 1 error(s)";
    expect(parseMarkdownLint(output)).toEqual({
      message: "Failed - 1 error",
      errors: 1,
    });
  });

  it("returns undefined when no errors", () => {
    expect(parseMarkdownLint("Summary: 0 error(s)")).toBeUndefined();
  });

  it("returns undefined when no errors", () => {
    expect(parseMarkdownLint("")).toBeUndefined();
  });
});
