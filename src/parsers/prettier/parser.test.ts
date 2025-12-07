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

const parsePrettier = resolveParser("Prettier");

describe("parsePrettier", () => {
  it("parses 'files not formatted' summary", () => {
    const output = "2 files are not formatted";

    expect(parsePrettier(output)).toEqual({
      message: "Failed - 2 files with formatting issues",
      errors: 2,
    });
  });

  it("parses 'files with code style issues' summary", () => {
    const output = "3 files with code style issues";

    expect(parsePrettier(output)).toEqual({
      message: "Failed - 3 files with formatting issues",
      errors: 3,
    });
  });

  it("treats 'above file' summary as one issue", () => {
    const output = [
      "Checking formatting...",
      "[warn] Code style issues found in the above file. Run Prettier with --write to fix.",
    ].join("\n");

    expect(parsePrettier(output)).toEqual({
      message: "Failed - 1 file with formatting issues",
      errors: 1,
    });
  });

  it("reads 'Code style issues found in N files' summary", () => {
    const output = [
      "Some header",
      "Code style issues found in 2 files. Run Prettier with --write to fix.",
    ].join("\n");

    expect(parsePrettier(output)).toEqual({
      message: "Failed - 2 files with formatting issues",
      errors: 2,
    });
  });

  it("returns undefined when no issues", () => {
    expect(parsePrettier("All matched")).toBeUndefined();
  });
});
