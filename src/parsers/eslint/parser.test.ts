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

const parseEslint = resolveParser("ESLint");

describe("parseEslint", () => {
  it("reports errors and warnings", () => {
    const output = "5 problems (3 errors, 2 warnings)";

    expect(parseEslint(output)).toEqual({
      message: "Failed - 3 errors and 2 warnings",
      errors: 3,
      warnings: 2,
    });
  });

  it("reports warnings when errors are zero", () => {
    const output = "2 problems (0 errors, 2 warnings)";

    expect(parseEslint(output)).toEqual({
      message: "Failed - 2 warnings",
      warnings: 2,
    });
  });

  it("returns undefined when no problems", () => {
    const output = "0 problems (0 errors, 0 warnings)";

    expect(parseEslint(output)).toBeUndefined();
  });
});
