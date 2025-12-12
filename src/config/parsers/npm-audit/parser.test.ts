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
});
