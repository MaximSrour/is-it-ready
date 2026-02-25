import { describe, expect, it } from "vitest";

import { parseCSpell } from "./parser";

describe("parseCSpell", () => {
  it("parses plural issues across multiple files", () => {
    const output = "CSpell: Files checked: 59, Issues found: 5 in 3 files.";

    const result = parseCSpell(output);

    expect(result).toEqual({
      message: "Failed - 5 issues in 3 files",
      errors: 5,
    });
  });

  it("parses plural issues within a single file", () => {
    const output = "CSpell: Files checked: 59, Issues found: 2 in 1 file.";

    const result = parseCSpell(output);

    expect(result).toEqual({
      message: "Failed - 2 issues in 1 file",
      errors: 2,
    });
  });

  it("parses singular issue in a single file", () => {
    const output = "CSpell: Files checked: 59, Issues found: 1 in 1 file.";

    const result = parseCSpell(output);

    expect(result).toEqual({
      message: "Failed - 1 issue in 1 file",
      errors: 1,
    });
  });

  it("returns undefined when nothing reported", () => {
    const output = "CSpell: Files checked: 59, Issues found: 0 in 0 files.";

    const result = parseCSpell(output);

    expect(result).toBeUndefined();
  });

  it("supports singular Issue wording and multi-digit counts", () => {
    const output = "Issue found: 12 in 10 files";

    expect(parseCSpell(output)).toEqual({
      message: "Failed - 12 issues in 10 files",
      errors: 12,
    });
  });

  it("supports extra whitespace in summary lines", () => {
    const output = "Issues    found:   10    in   2    files";

    expect(parseCSpell(output)).toEqual({
      message: "Failed - 10 issues in 2 files",
      errors: 10,
    });
  });

  it("omits file segment when file count is zero", () => {
    const output = "Issues found: 5 in 0 files";

    expect(parseCSpell(output)).toEqual({
      message: "Failed - 5 issues",
      errors: 5,
    });
  });

  it("parses issue count when file count section is missing", () => {
    const output = "Issues found: 3";

    expect(parseCSpell(output)).toEqual({
      message: "Failed - 3 issues",
      errors: 3,
    });
  });

  it("returns undefined when output has no cspell summary", () => {
    expect(parseCSpell("checked files with no summary")).toBeUndefined();
  });
});
