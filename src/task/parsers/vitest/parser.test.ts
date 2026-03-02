import { describe, expect, it } from "vitest";

import { parseVitest } from "./parser";

describe("parseVitest", () => {
  it("reports file and test failures", () => {
    const output = "Test Files 1 failed | Tests 2 failed";

    expect(parseVitest(output)).toEqual({
      message: "Failed - 2 tests failed in 1 file",
      errors: 2,
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

  it("handles multi-digit suite failures", () => {
    expect(parseVitest(" Failed Suites 12 ")).toEqual({
      message: "Failed - 12 suites failed",
      errors: 12,
    });
  });

  it("handles only file failures", () => {
    expect(parseVitest("Test Files 2 failed")).toEqual({
      message: "Failed - ",
      errors: 2,
    });
  });

  it("supports additional spacing in failure summary", () => {
    const output = "Test Files   10   failed | Tests   11   failed";

    expect(parseVitest(output)).toEqual({
      message: "Failed - 11 tests failed in 10 files",
      errors: 11,
    });
  });

  it("returns undefined when there is no vitest summary at all", () => {
    expect(parseVitest("plain output with no counters")).toBeUndefined();
  });

  it("uses singular test label when exactly one test fails", () => {
    expect(parseVitest("Tests 1 failed")).toEqual({
      message: "Failed - 1 test failed",
      errors: 1,
    });
  });

  it("parses singular vitest summary format", () => {
    expect(parseVitest("1 test failed in 1 file")).toEqual({
      message: "Failed - 1 test failed in 1 file",
      errors: 1,
    });
  });

  it("counts one error for legacy summary with one failed test in one file", () => {
    expect(parseVitest("Test Files 1 failed | Tests 1 failed")).toEqual({
      message: "Failed - 1 test failed in 1 file",
      errors: 1,
    });
  });

  it("returns undefined for zero failed suites", () => {
    expect(parseVitest(" Failed Suites 0 ")).toBeUndefined();
  });
});
