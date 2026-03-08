import chalk from "chalk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { noOp } from "../helpers";
import { type RunOptions } from "../runOptions/types";
import { type Task } from "../task/task";
import { type FailureDetails } from "../task/types";

import * as renderModule from "./render";
import { formatFailureHeadline, printFailureDetails, render } from "./render";
import { renderTable } from "./tableRenderer";

vi.mock("./tableRenderer", () => {
  return {
    renderTable: vi.fn(() => {
      return "TABLE";
    }),
  };
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

  it("uses singular noun when exactly one error is present", () => {
    const failure = { ...baseFailure, errors: 1 };
    const result = formatFailureHeadline(failure);
    const detail = chalk.red(chalk.red("1 error"));
    const expected = `${chalk.blue.underline("Linting")} - ESLint [${chalk.yellow(
      "npm run lint"
    )}] (${detail})`;

    expect(result).toBe(expected);
  });

  it("uses plural noun when multiple warnings are present", () => {
    const failure = { ...baseFailure, warnings: 2 };
    const result = formatFailureHeadline(failure);
    const detail = chalk.red(chalk.yellow("2 warnings"));
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
    isNoColor: false,
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

  it("prints stripped output when no-color is enabled", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    vi.spyOn(renderModule, "formatFailureHeadline").mockReturnValue("failed");

    printFailureDetails([baseFailure], {
      ...baseRunOptions,
      isNoColor: true,
    });

    expect(logSpy).toHaveBeenNthCalledWith(3, baseFailure.output);
  });

  it("uses no-output fallback in no-color mode when output is empty", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    vi.spyOn(renderModule, "formatFailureHeadline").mockReturnValue("failed");

    printFailureDetails(
      [{ ...baseFailure, output: "", rawOutput: "raw output" }],
      {
        ...baseRunOptions,
        isNoColor: true,
      }
    );

    expect(logSpy).toHaveBeenNthCalledWith(3, "(no output)");
  });

  it("prints nothing when no failures are provided", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);

    printFailureDetails([], baseRunOptions);

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("prints details header and each failure headline", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    const expectedHeadline = renderModule.formatFailureHeadline(baseFailure);

    printFailureDetails([baseFailure, baseFailure], baseRunOptions);

    expect(logSpy).toHaveBeenNthCalledWith(1, "Details:");
    expect(logSpy).toHaveBeenNthCalledWith(2, `\n${expectedHeadline}`);
    expect(logSpy).toHaveBeenNthCalledWith(4, `\n${expectedHeadline}`);
    expect(logSpy).toHaveBeenLastCalledWith();
  });
});

describe("render", () => {
  const renderTableMock = vi.mocked(renderTable);
  const baseRunOptions: RunOptions = {
    isSilentMode: false,
    isFixMode: false,
    isWatchMode: false,
    isNoColor: false,
    configPath: undefined,
  };
  const createConfig = (tasks: Task[], unsupportedTools: string[] = []) => {
    return {
      tasks,
      unsupportedTools,
    };
  };

  type TaskDoubleInput = {
    label: string;
    tool: string;
    usesExitCodeOnly?: boolean;
    state: "pending" | "running" | "success" | "failure";
    message: string;
    failures?: FailureDetails[];
    errors?: number;
    warnings?: number;
    startTime?: number | null;
    endTime?: number | null;
  };

  const createTaskDouble = (input: TaskDoubleInput): Task => {
    return {
      label: input.label,
      tool: input.tool,
      usesExitCodeOnly: input.usesExitCodeOnly ?? false,
      getStatus: () => {
        return { state: input.state, message: input.message };
      },
      getFailures: () => {
        return input.failures ?? [];
      },
      getTotalErrors: () => {
        return input.errors ?? 0;
      },
      getTotalWarnings: () => {
        return input.warnings ?? 0;
      },
      getStartTime: () => {
        return input.startTime ?? null;
      },
      getEndTime: () => {
        return input.endTime ?? null;
      },
    } as unknown as Task;
  };

  beforeEach(() => {
    chalk.level = 1;
    renderTableMock.mockReset();
    renderTableMock.mockReturnValue("TABLE");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders running summary and watch hint for unfinished suite", () => {
    vi.useFakeTimers();
    const now = new Date("2026-02-24T00:00:02.500Z");
    vi.setSystemTime(now);

    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    const clearSpy = vi.spyOn(console, "clear").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: true,
    });

    const tasks = [
      createTaskDouble({
        label: "Lint",
        tool: "ESLint",
        state: "success",
        message: "Done",
        startTime: now.getTime() - 1_500,
        endTime: now.getTime() - 500,
      }),
      createTaskDouble({
        label: "Type Check",
        tool: "TypeScript",
        state: "running",
        message: "Running...",
        warnings: 1,
        startTime: null,
        endTime: null,
      }),
    ];

    render(createConfig(tasks), { ...baseRunOptions, isWatchMode: true });

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "⏳ Overall",
      "",
      "1 issue (1 warning)",
      "1.5 s",
    ]);
    expect(logSpy).toHaveBeenCalledWith("TABLE");
    expect(logSpy).toHaveBeenCalledWith(
      chalk.cyan("\nWatching for file changes... (press Ctrl+C to exit)")
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      "(* indicates fix mode; some tasks will automatically apply fixes to your code)\n"
    );
    expect(logSpy).not.toHaveBeenCalledWith("Details:");
  });

  it("does not print failure details until suite is finished", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const failure: FailureDetails = {
      label: "Lint",
      tool: "ESLint",
      command: "npm run lint",
      output: "parsed",
      rawOutput: "raw",
      errors: 1,
    };

    const tasks = [
      createTaskDouble({
        label: "Lint",
        tool: "ESLint",
        state: "running",
        message: "Still running",
        failures: [failure],
        errors: 1,
        startTime: 1000,
        endTime: null,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(logSpy).not.toHaveBeenCalledWith("Details:");
  });

  it("renders finished failure summary and prints failure details", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const failure: FailureDetails = {
      label: "Lint",
      tool: "ESLint",
      command: "npm run lint",
      output: "parsed",
      rawOutput: "raw",
      errors: 2,
      warnings: 1,
    };

    const tasks = [
      createTaskDouble({
        label: "Lint",
        tool: "ESLint",
        state: "failure",
        message: "Failed",
        failures: [failure],
        errors: 2,
        warnings: 1,
        startTime: 1_000,
        endTime: 2_000,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "❌ Overall",
      "",
      "3 issues (2 errors, 1 warning)",
      "1.0 s",
    ]);
    expect(logSpy).toHaveBeenCalledWith("Details:");
    expect(logSpy).toHaveBeenCalledWith("raw");
    expect(logSpy).toHaveBeenCalledWith("TABLE");
    expect(logSpy).not.toHaveBeenCalledWith(
      chalk.cyan("\nWatching for file changes... (press Ctrl+C to exit)")
    );
  });

  it("renders fix mode banner and successful summary without details", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Tests",
        tool: "Vitest",
        state: "success",
        message: "Passed",
        errors: 0,
        warnings: 0,
        startTime: 5_000,
        endTime: 6_000,
      }),
    ];

    render(createConfig(tasks), { ...baseRunOptions, isFixMode: true });

    expect(logSpy).toHaveBeenCalledWith(
      "(* indicates fix mode; some tasks will automatically apply fixes to your code)\n"
    );
    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "✅ Overall",
      "",
      "0 issues",
      "1.0 s",
    ]);
    expect(logSpy).not.toHaveBeenCalledWith("Details:");
    expect(logSpy).not.toHaveBeenCalledWith(
      chalk.cyan("\nWatching for file changes... (press Ctrl+C to exit)")
    );
  });

  it("renders singular overall issue breakdown labels", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Lint",
        tool: "ESLint",
        state: "failure",
        message: "Failed",
        errors: 1,
        warnings: 1,
        failures: [],
        startTime: 10,
        endTime: 20,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "❌ Overall",
      "",
      "2 issues (1 error, 1 warning)",
      "10 ms",
    ]);
    expect(logSpy).toHaveBeenCalledWith("TABLE");
  });

  it("prints startup banner with package name and tagline", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Tests",
        tool: "Vitest",
        state: "success",
        message: "Passed",
        startTime: null,
        endTime: null,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    const firstCall = logSpy.mock.calls[0] as [string] | undefined;
    const firstArg = firstCall?.[0];
    expect(firstArg).toContain("is-it-ready");
    expect(firstArg).toContain("Validating your code quality");
  });

  it("does not clear console when stdout is not a TTY", () => {
    const clearSpy = vi.spyOn(console, "clear").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    render(
      createConfig([
        createTaskDouble({
          label: "Tests",
          tool: "Vitest",
          state: "success",
          message: "Passed",
        }),
      ]),
      baseRunOptions
    );

    expect(clearSpy).not.toHaveBeenCalled();
  });

  it("uses earliest task start time for overall duration", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "B",
        tool: "ToolB",
        state: "success",
        message: "ok",
        startTime: 1_000,
        endTime: 3_000,
      }),
      createTaskDouble({
        label: "A",
        tool: "ToolA",
        state: "success",
        message: "ok",
        startTime: 2_000,
        endTime: 4_000,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "✅ Overall",
      "",
      "0 issues",
      "3.0 s",
    ]);
    expect(logSpy).toHaveBeenCalledWith("TABLE");
  });

  it("uses zero duration when suite is finished but tasks have no timing data", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "A",
        tool: "ToolA",
        state: "success",
        message: "ok",
        startTime: null,
        endTime: null,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "✅ Overall",
      "",
      "0 issues",
      "0 ms",
    ]);
  });

  it("uses plural warning label in overall breakdown", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Warnings",
        tool: "Tool",
        state: "failure",
        message: "warning-only",
        warnings: 2,
        startTime: 100,
        endTime: 200,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "❌ Overall",
      "",
      "2 issues (2 warnings)",
      "100 ms",
    ]);
  });

  it("ignores tasks with partial timing information when computing suite duration", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Complete",
        tool: "ToolA",
        state: "success",
        message: "ok",
        startTime: 1_000,
        endTime: 2_000,
      }),
      createTaskDouble({
        label: "MissingEnd",
        tool: "ToolB",
        state: "success",
        message: "ok",
        startTime: 10,
        endTime: null,
      }),
      createTaskDouble({
        label: "MissingStart",
        tool: "ToolC",
        state: "success",
        message: "ok",
        startTime: null,
        endTime: 99_999,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "✅ Overall",
      "",
      "0 issues",
      "1.0 s",
    ]);
  });

  it("tracks suite end time from the first completed task when end timestamp is negative", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "A",
        tool: "ToolA",
        state: "success",
        message: "ok",
        startTime: -2_000,
        endTime: -1_000,
      }),
      createTaskDouble({
        label: "B",
        tool: "ToolB",
        state: "success",
        message: "ok",
        startTime: -1_500,
        endTime: -1_200,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "✅ Overall",
      "",
      "0 issues",
      "1.0 s",
    ]);
  });

  it("shows an amber warning for unsupported tools", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Custom Tool",
        tool: "Custom Tool",
        state: "success",
        message: "Passed",
        startTime: 1_000,
        endTime: 2_000,
      }),
    ];

    render(createConfig(tasks, ["Foo", "Bar"]), baseRunOptions);

    expect(logSpy).toHaveBeenCalledWith(
      chalk.yellow(
        "Warning: `Foo` and `Bar` tools aren't directly supported; using exit codes only."
      )
    );
  });

  it("uses singular wording for a single unsupported tool warning", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Foo",
        tool: "Foo",
        state: "success",
        message: "Passed",
        startTime: 1_000,
        endTime: 2_000,
      }),
    ];

    render(createConfig(tasks, ["Foo"]), baseRunOptions);

    expect(logSpy).toHaveBeenCalledWith(
      chalk.yellow(
        "Warning: `Foo` tool isn't directly supported; using exit codes only."
      )
    );
  });

  it("uses an Oxford comma when warning about three unsupported tools", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Foo",
        tool: "Foo",
        state: "success",
        message: "Passed",
        startTime: 1_000,
        endTime: 2_000,
      }),
    ];

    render(createConfig(tasks, ["test", "hello", "world"]), baseRunOptions);

    expect(logSpy).toHaveBeenCalledWith(
      chalk.yellow(
        "Warning: `test`, `hello`, and `world` tools aren't directly supported; using exit codes only."
      )
    );
  });

  it("does not print an unsupported-tools warning when all tools are supported", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "ESLint",
        tool: "ESLint",
        state: "success",
        message: "Passed",
        startTime: 1_000,
        endTime: 2_000,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("directly supported")
    );
  });

  it("uses a failure icon when a task failed without counted issues", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Custom Tool",
        tool: "Custom Tool",
        state: "failure",
        message: "Failed - see output below for details",
        startTime: 1_000,
        endTime: 2_000,
      }),
    ];

    render(createConfig(tasks, ["Custom Tool"]), baseRunOptions);

    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "❌ Overall",
      "",
      "0 issues",
      "1.0 s",
    ]);
  });

  it("uses a failure icon when a finished suite mixes success and failure states", () => {
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const tasks = [
      createTaskDouble({
        label: "Passed Task",
        tool: "ToolA",
        state: "success",
        message: "Passed",
        startTime: 1_000,
        endTime: 2_000,
      }),
      createTaskDouble({
        label: "Failed Task",
        tool: "ToolB",
        state: "failure",
        message: "Failed",
        errors: 1,
        startTime: 1_200,
        endTime: 2_200,
      }),
    ];

    render(createConfig(tasks), baseRunOptions);

    expect(renderTableMock).toHaveBeenCalledWith(tasks, [
      "❌ Overall",
      "",
      "1 issue (1 error)",
      "1.2 s",
    ]);
  });
});
