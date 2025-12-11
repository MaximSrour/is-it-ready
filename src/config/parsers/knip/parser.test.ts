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
});
