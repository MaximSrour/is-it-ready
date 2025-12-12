import { describe, expect, it } from "vitest";

import { parseNpmOutdated } from "./parser";

const sampleOutput = `
Package                           Current   Wanted  Latest  Location                                       Depended by
@types/node                       24.10.1  24.10.3  25.0.1  node_modules/@types/node                       is-it-ready
@typescript-eslint/eslint-plugin   8.48.1   8.49.0  8.49.0  node_modules/@typescript-eslint/eslint-plugin  is-it-ready
@typescript-eslint/parser          8.48.1   8.49.0  8.49.0  node_modules/@typescript-eslint/parser         is-it-ready
chalk                               4.1.2    4.1.2   5.6.2  node_modules/chalk                             is-it-ready
typescript-eslint                  8.48.1   8.49.0  8.49.0  node_modules/typescript-eslint                 is-it-ready
`;

describe("parseNpmOutdated", () => {
  it("counts packages where current differs from wanted", () => {
    const result = parseNpmOutdated(sampleOutput);

    expect(result).toEqual({
      message: "Failed - 4 outdated packages",
      errors: 4,
    });
  });

  it("returns undefined when no outdated packages", () => {
    const result = parseNpmOutdated(
      "Package Current Wanted Latest\nchalk 4.1.2 4.1.2 5.6.2"
    );

    expect(result).toBeUndefined();
  });

  it("handles output without table header", () => {
    const output = [
      "@scope/pkg 1.0.0 1.2.0 1.2.0 node_modules/@scope/pkg my-app",
      "npm ERR! something happened",
    ].join("\n");

    const result = parseNpmOutdated(output);

    expect(result).toEqual({
      message: "Failed - 1 outdated package",
      errors: 1,
    });
  });
});
