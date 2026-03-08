import { describe, expect, it } from "vitest";

import { parseStryker } from "./parser";

describe("parseStryker", () => {
  it("returns undefined when the all files row reports no issues", () => {
    const output = [
      "------------------------|------------------|----------|-----------|------------|----------|----------|",
      "                        | % Mutation score |          |           |            |          |          |",
      "File                    |  total | covered | # killed | # timeout | # survived | # no cov | # errors |",
      "------------------------|--------|---------|----------|-----------|------------|----------|----------|",
      "All files               | 100.00 |  100.00 |      100 |         0 |          0 |        0 |        0 |",
    ].join("\n");

    expect(parseStryker(output)).toBeUndefined();
  });

  it("counts all non-killed issues from the all files row", () => {
    const output = [
      "------------------------|------------------|----------|-----------|------------|----------|----------|",
      "                        | % Mutation score |          |           |            |          |          |",
      "File                    |  total | covered | # killed | # timeout | # survived | # no cov | # errors |",
      "------------------------|--------|---------|----------|-----------|------------|----------|----------|",
      "   All files            |  99.68 |   99.84 |      628 |         1 |          2 |        3 |        4 |",
    ].join("\n");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 10 issues",
      errors: 10,
    });
  });

  it("ignores file rows and only reads the all files summary", () => {
    const output = [
      "------------------------|------------------|----------|-----------|------------|----------|----------|",
      "                        | % Mutation score |          |           |            |          |          |",
      "File                    |  total | covered | # killed | # timeout | # survived | # no cov | # errors |",
      "------------------------|--------|---------|----------|-----------|------------|----------|----------|",
      "All files               | 100.00 |  100.00 |      100 |         0 |          0 |        0 |        0 |",
      " config                 |  80.00 |   80.00 |        8 |         0 |          1 |        1 |        0 |",
    ].join("\n");

    expect(parseStryker(output)).toBeUndefined();
  });

  it("handles the sample output by counting only the all files issues", () => {
    const output = [
      "------------------------|------------------|----------|-----------|------------|----------|----------|",
      "                        | % Mutation score |          |           |            |          |          |",
      "File                    |  total | covered | # killed | # timeout | # survived | # no cov | # errors |",
      "------------------------|--------|---------|----------|-----------|------------|----------|----------|",
      "All files               |  99.84 |   99.92 |     1269 |         0 |          1 |        1 |        0 |",
      " config                 |  99.08 |   99.08 |      108 |         0 |          1 |        0 |        0 |",
    ].join("\n");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 2 issues",
      errors: 2,
    });
  });

  it("returns undefined when there is no recognizable summary table", () => {
    expect(
      parseStryker("Mutation testing completed successfully.")
    ).toBeUndefined();
  });

  it("returns a singular issue message when exactly one issue remains", () => {
    const output = [
      "------------------------|------------------|----------|-----------|------------|----------|----------|",
      "                        | % Mutation score |          |           |            |          |          |",
      "File                    |  total | covered | # killed | # timeout | # survived | # no cov | # errors |",
      "------------------------|--------|---------|----------|-----------|------------|----------|----------|",
      "All files               |  99.92 |  100.00 |      624 |         0 |          1 |        0 |        0 |",
    ].join("\n");

    expect(parseStryker(output)).toEqual({
      message: "Failed - 1 issue",
      errors: 1,
    });
  });

  it("returns undefined when an issue count is not numeric", () => {
    const output = [
      "------------------------|------------------|----------|-----------|------------|----------|----------|",
      "                        | % Mutation score |          |           |            |          |          |",
      "File                    |  total | covered | # killed | # timeout | # survived | # no cov | # errors |",
      "------------------------|--------|---------|----------|-----------|------------|----------|----------|",
      "All files               |  99.92 |  100.00 |      624 |         x |          1 |        0 |        0 |",
    ].join("\n");

    expect(parseStryker(output)).toBeUndefined();
  });

  it("returns undefined when the all files row has the wrong label", () => {
    const output = [
      "------------------------|------------------|----------|-----------|------------|----------|----------|",
      "                        | % Mutation score |          |           |            |          |          |",
      "File                    |  total | covered | # killed | # timeout | # survived | # no cov | # errors |",
      "------------------------|--------|---------|----------|-----------|------------|----------|----------|",
      "All files total         |  99.92 |  100.00 |      624 |         0 |          1 |        0 |        0 |",
    ].join("\n");

    expect(parseStryker(output)).toBeUndefined();
  });

  it("returns undefined when the all files row has too few columns", () => {
    const output = [
      "------------------------|------------------|----------|-----------|------------|----------|----------|",
      "                        | % Mutation score |          |           |            |          |          |",
      "File                    |  total | covered | # killed | # timeout | # survived | # no cov | # errors |",
      "------------------------|--------|---------|----------|-----------|------------|----------|----------|",
      "All files               |  99.92 |  100.00 |      624 |         0 |          1 |        0 |",
    ].join("\n");

    expect(parseStryker(output)).toBeUndefined();
  });

  it("returns undefined when the all files row has too many columns", () => {
    const output = [
      "------------------------|------------------|----------|-----------|------------|----------|----------|",
      "                        | % Mutation score |          |           |            |          |          |",
      "File                    |  total | covered | # killed | # timeout | # survived | # no cov | # errors |",
      "------------------------|--------|---------|----------|-----------|------------|----------|----------|",
      "All files               |  99.92 |  100.00 |      624 |         0 |          1 |        0 |        0 | extra |",
    ].join("\n");

    expect(parseStryker(output)).toBeUndefined();
  });
});
