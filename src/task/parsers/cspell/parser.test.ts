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
});
