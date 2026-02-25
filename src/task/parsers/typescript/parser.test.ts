import { describe, expect, it } from "vitest";

import { parseTypeCheck } from "./parser";

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

  it("parses single-file summary with singular label", () => {
    expect(parseTypeCheck("Found 1 error in 1 file")).toEqual({
      message: "Failed - 1 errors in 1 file",
      errors: 1,
    });
  });

  it("parses multi-digit summary values", () => {
    expect(parseTypeCheck("Found 12 errors in 10 files")).toEqual({
      message: "Failed - 12 errors in 10 files",
      errors: 12,
    });
  });

  it("parses fallback summary without file count", () => {
    expect(parseTypeCheck("Found 10 errors.")).toEqual({
      message: "Failed - 10 errors",
      errors: 10,
    });
  });

  it("parses singular fallback summary without file count", () => {
    expect(parseTypeCheck("Found 1 error.")).toEqual({
      message: "Failed - 1 errors",
      errors: 1,
    });
  });

  it("counts fallback TS error lines with extra spacing", () => {
    const output = [
      "src/a.ts(10,12):  error   TS1234: Example",
      "src/c.ts(1,1): error TS2222: Another",
    ].join("\n");

    expect(parseTypeCheck(output)).toEqual({
      message: "Failed - 2 errors in 2 files",
      errors: 2,
    });
  });

  it("returns undefined when fallback summary reports zero", () => {
    expect(parseTypeCheck("Found 0 errors")).toBeUndefined();
  });

  it("uses singular file label in fallback error-line parsing", () => {
    const output = "src/a.ts(1,1): error TS1234: Example";

    expect(parseTypeCheck(output)).toEqual({
      message: "Failed - 1 errors in 1 file",
      errors: 1,
    });
  });

  it("normalizes repeated whitespace in summary output", () => {
    expect(parseTypeCheck("Found 4  \n  errors in 2 files")).toEqual({
      message: "Failed - 4 errors in 2 files",
      errors: 4,
    });
  });

  it("trims file names before counting unique files in fallback parsing", () => {
    const output = [
      "src/a.ts(1,1): error TS1234: One",
      "src/a.ts (2,1): error TS1234: Two",
    ].join("\n");

    expect(parseTypeCheck(output)).toEqual({
      message: "Failed - 2 errors in 1 file",
      errors: 2,
    });
  });

  it("returns undefined for zero-error summary with file count", () => {
    expect(parseTypeCheck("Found 0 errors in 1 file")).toBeUndefined();
  });
});
