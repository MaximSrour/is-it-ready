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

const parseTypeCheck = resolveParser("TypeScript");

describe("parseTypeCheck", () => {
  it("parses summary for errors and files", () => {
    const output = "Found 4 errors in 2 files";

    expect(parseTypeCheck(output)).toEqual({
      message: "Failed - 4 errors in 2 files",
      errors: 4,
    });
  });

  it("counts file references when summary missing", () => {
    const output = [
      "src/a.ts(1,2): error TS1234: Example",
      "src/a.ts(2,2): error TS1111: Another",
      "src/b.ts(5,1): error TS2222: Something",
    ].join("\n");

    expect(parseTypeCheck(output)).toEqual({
      message: "Failed - 3 errors in 2 files",
      errors: 3,
    });
  });

  it("returns undefined when no matches", () => {
    expect(parseTypeCheck("No errors found")).toBeUndefined();
  });
});
