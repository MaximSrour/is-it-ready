import { describe, expect, it } from "vitest";

import { parseStryker } from "./parser";

describe("parseStryker", () => {
  // The "progress-append-only" format is used when Stryker detects a non-TTY
  // Environment (e.g. running inside is-it-ready). Each update is a new line.
  const appendOnlyLine = (fraction: string, details: string) => {
    return `Mutation testing 99% (elapsed: <1m, remaining: n/a) ${fraction} tested (${details})`;
  };

  it("returns failure with survived and timed out counts", () => {
    const output = appendOnlyLine("1503/1503", "16 survived, 2 timed out");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 18 issues",
      errors: 18,
    });
  });

  it("returns failure with only survived count", () => {
    const output = appendOnlyLine("1503/1503", "3 survived");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 3 issues",
      errors: 3,
    });
  });

  it("returns failure with only timed out count", () => {
    const output = appendOnlyLine("1503/1503", "2 timed out");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 2 issues",
      errors: 2,
    });
  });

  it("returns undefined when all mutants are killed", () => {
    const output = appendOnlyLine("1503/1503", "1503 killed");

    expect(parseStryker(output)).toBeUndefined();
  });

  it("uses the final line when multiple append-only updates are present", () => {
    const output = [
      appendOnlyLine("493/1471", "8 survived, 1 timed out"),
      appendOnlyLine("1279/1471", "16 survived, 2 timed out"),
    ].join("\n");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 18 issues",
      errors: 18,
    });
  });

  it("handles multi-digit fraction totals correctly", () => {
    const output = appendOnlyLine("1234/5678", "3 survived");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 3 issues",
      errors: 3,
    });
  });

  it("handles multi-digit timed out count", () => {
    const output = appendOnlyLine("1503/1503", "12 timed out");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 12 issues",
      errors: 12,
    });
  });

  it("returns undefined when there is no recognizable progress line", () => {
    expect(
      parseStryker("Mutation testing completed successfully.")
    ).toBeUndefined();
  });

  it("uses singular issue message when exactly one issue remains", () => {
    const output = appendOnlyLine("1503/1503", "1 survived");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 1 issue",
      errors: 1,
    });
  });
});
