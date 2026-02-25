import { describe, expect, it } from "vitest";

import { parseNpmAudit } from "./parser";

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

  it("reports singular vulnerability count with breakdown", () => {
    const output = [
      "1 vulnerability (1 error)",
      "0 vulnerabilities require manual review.",
    ].join("\n");

    const result = parseNpmAudit(output);

    expect(result).toEqual({
      message: "Failed - 1 vulnerability (1 error)",
      errors: 1,
    });
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

  it("reports severity-only summaries", () => {
    const output = "2 moderate severity vulnerabilities";

    expect(parseNpmAudit(output)).toEqual({
      message: "Failed - 2 vulnerabilities (2 moderate)",
      errors: 2,
    });
  });

  it("parses singular severity summaries", () => {
    expect(parseNpmAudit("1 low severity vulnerability")).toEqual({
      message: "Failed - 1 vulnerability (1 low)",
      errors: 1,
    });
  });

  it("returns generic vulnerability failure for npm error output", () => {
    const output = "npm ERR! audit endpoint returned vulnerabilities";

    expect(parseNpmAudit(output)).toEqual({
      message: "Failed - vulnerabilities detected",
      errors: 1,
    });
  });

  it("returns undefined when input has no vulnerability indicators", () => {
    expect(parseNpmAudit("audit completed successfully")).toBeUndefined();
  });

  it("parses summary without a breakdown section", () => {
    expect(parseNpmAudit("found 2 vulnerabilities")).toEqual({
      message: "Failed - 2 vulnerabilities",
      errors: 2,
    });
  });

  it("returns undefined for zero severity vulnerability summaries", () => {
    expect(parseNpmAudit("0 moderate severity vulnerabilities")).toBeUndefined();
  });

  it("parses multi-digit severity summaries", () => {
    expect(parseNpmAudit("12 moderate severity vulnerabilities")).toEqual({
      message: "Failed - 12 vulnerabilities (12 moderate)",
      errors: 12,
    });
  });

  it("falls back to generic vulnerability failure without npm err marker", () => {
    expect(parseNpmAudit("vulnerabilities were detected")).toEqual({
      message: "Failed - vulnerabilities detected",
      errors: 1,
    });
  });

  it("normalizes repeated whitespace in severity summaries", () => {
    expect(parseNpmAudit("2   moderate \n   severity vulnerabilities")).toEqual({
      message: "Failed - 2 vulnerabilities (2 moderate)",
      errors: 2,
    });
  });
});
