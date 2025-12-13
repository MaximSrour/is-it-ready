import { describe, expect, it } from "vitest";

import { parseVitest } from "./parser";

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

  it("handles single suite failure", () => {
    expect(parseVitest(" Failed Suites 1 ")).toEqual({
      message: "Failed - 1 suite failed",
      errors: 1,
    });
  });

  it("handles multiple suite failures", () => {
    expect(parseVitest(" Failed Suites 2 ")).toEqual({
      message: "Failed - 2 suites failed",
      errors: 2,
    });
  });
});
