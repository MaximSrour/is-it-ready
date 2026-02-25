import { describe, expect, it } from "vitest";

import { parseEslint } from "./parser";

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

  it("parses single error when warning section is missing", () => {
    const output = "1 problem (1 error)";

    expect(parseEslint(output)).toEqual({
      message: "Failed - 1 errors",
      errors: 1,
      warnings: undefined,
    });
  });

  it("parses singular warning message", () => {
    const output = "1 problem (0 errors, 1 warning)";

    expect(parseEslint(output)).toEqual({
      message: "Failed - 1 warning",
      warnings: 1,
    });
  });

  it("parses multi-digit counts with extra whitespace", () => {
    const output = "12   problems   (10   errors,   2   warnings)";

    expect(parseEslint(output)).toEqual({
      message: "Failed - 10 errors and 2 warnings",
      errors: 10,
      warnings: 2,
    });
  });

  it("parses multi-digit warning counts in warning-only output", () => {
    const output = "10 problems (0 errors, 10 warnings)";

    expect(parseEslint(output)).toEqual({
      message: "Failed - 10 warnings",
      warnings: 10,
    });
  });

  it("returns undefined for malformed summary", () => {
    expect(parseEslint("problems: none")).toBeUndefined();
  });

  it("returns undefined when totals do not match parsed counts", () => {
    expect(parseEslint("5 problems (3 errors, 1 warning)")).toBeUndefined();
  });
});
