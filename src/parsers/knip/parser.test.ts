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

const parseKnip = resolveParser("Knip");

describe("parseKnip", () => {
  it("sums section counts", () => {
    const output = ["Unused files (2)", "Unused dependencies (1)"].join("\n");

    expect(parseKnip(output)).toEqual({
      message: "Failed - 3 issues",
      errors: 3,
    });
  });

  it("falls back to generic issues count", () => {
    const output = "Found 5 issues";

    expect(parseKnip(output)).toEqual({
      message: "Failed - 5 issues",
      errors: 5,
    });
  });

  it("returns undefined when nothing reported", () => {
    expect(parseKnip("All clean")).toBeUndefined();
  });
});
