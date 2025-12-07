import { describe, expect, it } from "vitest";

import {
  parseEslint,
  parseKnip,
  parseNpmAudit,
  parsePrettier,
  parseTypeCheck,
  parseVitest,
} from "./parsers";

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

describe("parseVitest", () => {
  it("reports file and test failures", () => {
    const output = "Test Files 1 failed | Tests 2 failed";
    expect(parseVitest(output)).toEqual({
      message: "Failed - 2 tests failed in 1 file",
      errors: 3,
    });
  });

  it("handles only test failures", () => {
    expect(parseVitest("Tests 5 failed")).toEqual({
      message: "Failed - 5 tests failed",
      errors: 5,
    });
  });

  it("returns undefined when success", () => {
    expect(parseVitest("Test Files 0 failed | Tests 0 failed")).toBeUndefined();
  });
});

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

describe("parseNpmAudit", () => {
  it("reports vulnerability count with breakdown", () => {
    const output = [
      "13 vulnerabilities (6 moderate, 7 high)",
      "0 vulnerabilities require manual review.",
    ].join("\n");
    expect(parseNpmAudit(output)).toEqual({
      message: "Failed - 13 vulnerabilities (6 moderate, 7 high)",
      errors: 13,
    });
  });

  it("returns undefined when no vulnerabilities", () => {
    expect(parseNpmAudit("found 0 vulnerabilities")).toBeUndefined();
  });

  it("parses summary without 'found' prefix", () => {
    const output = [
      "# npm audit report",
      "cross-spawn  <6.0.6",
      "13 vulnerabilities (6 moderate, 7 high)",
    ].join("\n");
    expect(parseNpmAudit(output)).toEqual({
      message: "Failed - 13 vulnerabilities (6 moderate, 7 high)",
      errors: 13,
    });
  });
});
