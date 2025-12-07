import chalk from "chalk";
import { beforeEach, describe, expect, it } from "vitest";

import {
  colorStatusMessage,
  formatFailureHeadline,
  getDisplayWidth,
  isFullWidthCodePoint,
  padCell,
  renderBorder,
  renderRow,
} from "./render";
import { type FailureDetails } from "./types";

describe("renderBorder", () => {
  it("renders top border with provided widths", () => {
    const result = renderBorder([2, 3], "top");
    expect(result).toBe("┌────┬─────┐");
  });

  it("renders bottom border with provided widths", () => {
    const result = renderBorder([3, 2], "bottom");
    expect(result).toBe("└─────┴────┘");
  });
});

describe("renderRow", () => {
  it("pads cells according to column widths", () => {
    const row = renderRow(["A", "B"], [3, 2]);
    expect(row).toBe("│ A   │ B  │");
  });
});

describe("padCell", () => {
  it("pads strings shorter than column width", () => {
    expect(padCell("Hi", 4)).toBe("Hi  ");
  });

  it("returns string unchanged when width already met", () => {
    expect(padCell("Hello", 3)).toBe("Hello");
  });
});

describe("getDisplayWidth", () => {
  it("counts ASCII characters as single width", () => {
    expect(getDisplayWidth("abc")).toBe(3);
  });

  it("counts emoji as double width", () => {
    expect(getDisplayWidth("✅")).toBe(2);
  });
});

describe("isFullWidthCodePoint", () => {
  it("returns true for known full-width code point", () => {
    expect(isFullWidthCodePoint(0x1100)).toBe(true);
  });

  it("returns false for undefined or ASCII code points", () => {
    expect(isFullWidthCodePoint(undefined)).toBe(false);
    expect(isFullWidthCodePoint(0x41)).toBe(false);
  });
});

describe("colorStatusMessage", () => {
  beforeEach(() => {
    chalk.level = 1;
  });

  it("returns empty string when message missing", () => {
    expect(colorStatusMessage("", "pending")).toBe("");
  });

  it("colors message red for failure state", () => {
    expect(colorStatusMessage("Failed", "failure")).toBe(
      "\u001b[31mFailed\u001b[39m"
    );
  });

  it("leaves other states uncolored", () => {
    expect(colorStatusMessage("Working", "running")).toBe("Working");
  });
});

describe("formatFailureHeadline", () => {
  const baseFailure: FailureDetails = {
    label: "Linting",
    tool: "ESLint",
    command: "npm run lint",
    output: "out",
    rawOutput: "raw",
  };

  beforeEach(() => {
    chalk.level = 1;
  });

  it("includes colored breakdown when errors and warnings present", () => {
    const failure = { ...baseFailure, errors: 2, warnings: 1 };
    const result = formatFailureHeadline(failure);
    const detail = chalk.red(
      `${chalk.red("2 errors")}, ${chalk.yellow("1 warning")}`
    );
    const expected = `${chalk.blue.underline("Linting")} - ESLint [${chalk.yellow(
      "npm run lint"
    )}] (${detail})`;

    expect(result).toBe(expected);
  });

  it("falls back to summary when no counts provided", () => {
    const failure = { ...baseFailure, summary: "Failed fast" };
    const result = formatFailureHeadline(failure);
    const detail = chalk.red("Failed fast");
    const expected = `${chalk.blue.underline("Linting")} - ESLint [${chalk.yellow(
      "npm run lint"
    )}] (${detail})`;

    expect(result).toBe(expected);
  });

  it("defaults to generic message when neither counts nor summary provided", () => {
    const result = formatFailureHeadline(baseFailure);
    const detail = chalk.red("See output");
    const expected = `${chalk.blue.underline("Linting")} - ESLint [${chalk.yellow(
      "npm run lint"
    )}] (${detail})`;

    expect(result).toBe(expected);
  });
});
