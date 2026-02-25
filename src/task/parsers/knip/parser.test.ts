import { describe, expect, it } from "vitest";

import { parseKnip } from "./parser";

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

  it("handles multi-digit section counts with extra whitespace", () => {
    const output = [
      "Unused files (10)",
      "Unused dependencies (2)",
      "Other group ( 0 )",
    ].join("\n");

    expect(parseKnip(output)).toEqual({
      message: "Failed - 12 issues",
      errors: 12,
    });
  });

  it("falls back for singular issue wording", () => {
    expect(parseKnip("Found 1 issue")).toEqual({
      message: "Failed - 1 issue",
      errors: 1,
    });
  });

  it("falls back for multi-digit issue wording", () => {
    expect(parseKnip("Found 12 issues")).toEqual({
      message: "Failed - 12 issues",
      errors: 12,
    });
  });

  it("returns undefined when sections are zero and fallback is zero", () => {
    const output = ["Unused files (0)", "Found 0 issues"].join("\n");
    expect(parseKnip(output)).toBeUndefined();
  });

  it("does not replace section totals with fallback text when sections already matched", () => {
    const output = ["Unused files (2)", "Found 10 issues"].join("\n");

    expect(parseKnip(output)).toEqual({
      message: "Failed - 2 issues",
      errors: 2,
    });
  });

  it("normalizes repeated whitespace around fallback issue summaries", () => {
    expect(parseKnip("Found 5  \n   issues")).toEqual({
      message: "Failed - 5 issues",
      errors: 5,
    });
  });
});
