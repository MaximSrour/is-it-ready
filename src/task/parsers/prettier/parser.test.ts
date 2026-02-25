import { describe, expect, it } from "vitest";

import { parsePrettier } from "./parser";

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

  it("parses singular file summary", () => {
    expect(parsePrettier("1 file is not formatted")).toEqual({
      message: "Failed - 1 file with formatting issues",
      errors: 1,
    });
  });

  it("parses multi-digit values with extra whitespace", () => {
    expect(parsePrettier("12   files   with code style issues")).toEqual({
      message: "Failed - 12 files with formatting issues",
      errors: 12,
    });
  });

  it("parses singular issue wording in code style summary", () => {
    expect(parsePrettier("1 file with code style issue")).toEqual({
      message: "Failed - 1 file with formatting issues",
      errors: 1,
    });
  });

  it("parses multi-digit 'files not formatted' summaries", () => {
    expect(parsePrettier("12 files are not formatted")).toEqual({
      message: "Failed - 12 files with formatting issues",
      errors: 12,
    });
  });

  it("parses multi-digit values in 'found in N files' summary", () => {
    expect(
      parsePrettier("Code style issues found in 12 files. Run with --write")
    ).toEqual({
      message: "Failed - 12 files with formatting issues",
      errors: 12,
    });
  });

  it("parses singular 'found in file' summary", () => {
    expect(parsePrettier("Code style issues found in 1 file")).toEqual({
      message: "Failed - 1 file with formatting issues",
      errors: 1,
    });
  });

  it("falls back to generic failure when summary count is zero", () => {
    expect(parsePrettier("0 files are not formatted")).toEqual({
      message: "Failed",
      errors: 1,
    });
  });
});
