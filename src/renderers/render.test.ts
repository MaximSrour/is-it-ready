import chalk from "chalk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type FailureDetails } from "@/task/types";

import { noOp } from "../helpers";
import * as renderModule from "./render";
import { formatFailureHeadline, printFailureDetails } from "./render";

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

  afterEach(() => {
    vi.restoreAllMocks();
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

describe("printFailureDetails", () => {
  const baseFailure: FailureDetails = {
    label: "Tests",
    tool: "Vitest",
    command: "npm test",
    output: "parsed output",
    rawOutput: "raw output",
  };
  const baseRunOptions = {
    isSilentMode: false,
    isFixMode: false,
    isWatchMode: false,
    configPath: undefined,
    showHelp: false,
    showVersion: false,
  };

  beforeEach(() => {
    chalk.level = 1;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints a hint when silent mode suppresses failure details", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);

    printFailureDetails([baseFailure], {
      ...baseRunOptions,
      isSilentMode: true,
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      "Some checks failed. Run without --silent to see details."
    );
  });

  it("falls back to parsed output and defaults when no raw output exists", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    vi.spyOn(renderModule, "formatFailureHeadline").mockReturnValue("failed");

    const failureWithoutRaw = { ...baseFailure, rawOutput: "" };
    const failureWithoutOutputs = { ...baseFailure, rawOutput: "", output: "" };

    printFailureDetails(
      [failureWithoutRaw, failureWithoutOutputs],
      baseRunOptions
    );

    expect(logSpy).toHaveBeenNthCalledWith(3, failureWithoutRaw.output);
    expect(logSpy).toHaveBeenNthCalledWith(5, "(no output)");
  });
});
