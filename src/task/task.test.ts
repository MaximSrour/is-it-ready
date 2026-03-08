import { afterEach, describe, expect, it, vi } from "vitest";

import * as helpers from "../helpers";
import { noOp } from "../helpers";

import { Task } from "./task";

export const createMockTask = (
  taskOverrides: Partial<Task> = {},
  optionsOverrides = {}
): Task => {
  return new Task(
    {
      label: "Echo Task",
      tool: "Echo",
      command: "echo 'Echo command'",
      fixCommand: "echo 'Echo command fix'",
      parseFailure: () => {
        return undefined;
      },
      ...taskOverrides,
    },
    {
      isFixMode: false,
      isSilentMode: false,
      isWatchMode: false,
      isNoColor: false,
      configPath: undefined,
      ...optionsOverrides,
    }
  );
};

describe("Task", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs the task when triggering the execute method", async () => {
    const runCommandSpy = vi
      .spyOn(helpers, "runCommand")
      .mockResolvedValue({ status: 0, stdout: "Echo command\n", stderr: "" });
    let commandOutput = "";

    const task = createMockTask({
      parseFailure: (output) => {
        commandOutput = output;

        return undefined;
      },
    });

    expect(task.label).toBe("Echo Task");
    expect(task.command).toBe("echo 'Echo command'");
    expect(task.tool).toBe("Echo");

    const result = await task.execute();

    expect(result).toBeUndefined();
    expect(runCommandSpy).toHaveBeenCalledWith(
      "echo 'Echo command'",
      expect.objectContaining({
        isFixMode: false,
        isSilentMode: false,
        isWatchMode: false,
        isNoColor: false,
        configPath: undefined,
      })
    );
    expect(commandOutput.trim()).toBe("Echo command");
  });

  it("runs the fix task when triggering the execute method", async () => {
    const runCommandSpy = vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 0,
      stdout: "Echo command fix\n",
      stderr: "",
    });
    let commandOutput = "";

    const task = createMockTask(
      {
        parseFailure: (output) => {
          commandOutput = output;

          return undefined;
        },
      },
      {
        isFixMode: true,
      }
    );

    expect(task.label).toBe("Echo Task*");
    expect(task.command).toBe("echo 'Echo command fix'");
    expect(task.tool).toBe("Echo");

    const result = await task.execute();

    expect(result).toBeUndefined();
    expect(runCommandSpy).toHaveBeenCalledWith(
      "echo 'Echo command fix'",
      expect.objectContaining({
        isFixMode: true,
      })
    );
    expect(commandOutput.trim()).toBe("Echo command fix");
  });

  it("records duration for a 1 second task without real waiting", async () => {
    const runCommandSpy = vi
      .spyOn(helpers, "runCommand")
      .mockResolvedValue({ status: 0, stdout: "", stderr: "" });
    const dateSpy = vi
      .spyOn(Date, "now")
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2050);

    const task = createMockTask();

    await task.execute();

    const duration = task.getDuration();

    expect(runCommandSpy).toHaveBeenCalledWith(
      "echo 'Echo command'",
      expect.objectContaining({
        isFixMode: false,
      })
    );
    expect(duration).not.toBeNull();
    expect(duration as number).toBe(1050);

    dateSpy.mockRestore();
  });

  it("runs triggers the onStart and onFinish callbacks", async () => {
    const runCommandSpy = vi
      .spyOn(helpers, "runCommand")
      .mockResolvedValue({ status: 0, stdout: "Echo command\n", stderr: "" });
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    let commandOutput = "";

    const task = createMockTask({
      parseFailure: (output) => {
        commandOutput = output;

        return undefined;
      },
    });

    const result = await task.execute({
      onStart: () => {
        console.log("Task started");
      },
      onFinish: () => {
        console.log("Task finished");
      },
    });

    expect(result).toBeUndefined();
    expect(runCommandSpy).toHaveBeenCalledWith(
      "echo 'Echo command'",
      expect.objectContaining({
        isFixMode: false,
      })
    );
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(commandOutput.trim()).toBe("Echo command");
  });

  it("initializes with pending status and zero issue counts", () => {
    const task = createMockTask();

    expect(task.getStatus()).toEqual({ state: "pending", message: "" });
    expect(task.getStartTime()).toBeNull();
    expect(task.getEndTime()).toBeNull();
    expect(task.getDuration()).toBeNull();
    expect(task.getFailures()).toEqual([]);
    expect(task.getTotalErrors()).toBe(0);
    expect(task.getTotalWarnings()).toBe(0);
  });

  it("marks as success with Passed message when command succeeds", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 0,
      stdout: "ok",
      stderr: "",
    });

    const task = createMockTask();
    await task.execute();

    expect(task.getStatus()).toEqual({ state: "success", message: "Passed" });
    expect(task.getFailures()).toEqual([]);
    expect(task.getTotalErrors()).toBe(0);
    expect(task.getTotalWarnings()).toBe(0);
    expect(task.getStartTime()).not.toBeNull();
    expect(task.getEndTime()).not.toBeNull();
  });

  it("records parsed failure details when command exits with non-zero status", async () => {
    const parseFailureMock = vi.fn(() => {
      return {
        message: "Failed - 2 errors and 1 warning",
        errors: 2,
        warnings: 1,
      };
    });
    // eslint-disable-next-line no-useless-concat -- necessary to preserve the escape codes in the string without them being interpreted as a cspell error
    const redLineOne = "\u001b[31m" + "line one\u001b[39m";
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 1,
      stdout: redLineOne,
      stderr: "line two",
    });

    const task = createMockTask({ parseFailure: parseFailureMock });
    await task.execute();

    expect(parseFailureMock).toHaveBeenCalledWith("line one\nline two");
    expect(task.getStatus()).toEqual({
      state: "failure",
      message: "Failed - 2 errors and 1 warning",
    });
    expect(task.getTotalErrors()).toBe(2);
    expect(task.getTotalWarnings()).toBe(1);
    expect(task.getFailures()).toEqual([
      {
        label: "Echo Task",
        tool: "Echo",
        command: "echo 'Echo command'",
        errors: 2,
        warnings: 1,
        summary: "Failed - 2 errors and 1 warning",
        output: "line one\nline two",
        rawOutput: `${redLineOne}\nline two`,
      },
    ]);
  });

  it("treats parsed failure with zero counts as one error", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 1,
      stdout: "bad output",
      stderr: "",
    });

    const task = createMockTask({
      parseFailure: () => {
        return { message: "Failed - unknown issue", errors: 0, warnings: 0 };
      },
    });

    await task.execute();

    expect(task.getStatus().state).toBe("failure");
    expect(task.getTotalErrors()).toBe(1);
    expect(task.getTotalWarnings()).toBe(0);
  });

  it("uses failure path when parseFailure returns data even with zero exit status", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 0,
      stdout: "reported issue",
      stderr: "",
    });

    const task = createMockTask({
      parseFailure: () => {
        return { message: "Failed - parser detected issue", errors: 1 };
      },
    });

    await task.execute();

    expect(task.getStatus()).toEqual({
      state: "failure",
      message: "Failed - parser detected issue",
    });
    expect(task.getFailures()).toHaveLength(1);
    expect(task.getTotalErrors()).toBe(1);
  });

  it("handles thrown Error values from runCommand", async () => {
    vi.spyOn(helpers, "runCommand").mockRejectedValue(
      new Error("spawn failed")
    );

    const task = createMockTask();
    await task.execute();

    expect(task.getStatus()).toEqual({
      state: "failure",
      message: "spawn failed",
    });
    expect(task.getTotalErrors()).toBe(1);
    expect(task.getFailures()).toEqual([
      {
        label: "Echo Task",
        tool: "Echo",
        command: "echo 'Echo command'",
        summary: "spawn failed",
        output: "spawn failed",
        rawOutput: "spawn failed",
      },
    ]);
  });

  it("handles thrown string values from runCommand", async () => {
    vi.spyOn(helpers, "runCommand").mockRejectedValue("string failure");

    const task = createMockTask();
    await task.execute();

    expect(task.getStatus()).toEqual({
      state: "failure",
      message: "string failure",
    });
    expect(task.getTotalErrors()).toBe(1);
  });

  it("falls back to generic message for unknown thrown values", async () => {
    vi.spyOn(helpers, "runCommand").mockRejectedValue(123);

    const task = createMockTask();
    await task.execute();

    expect(task.getStatus()).toEqual({
      state: "failure",
      message: "Failed to execute command",
    });
    expect(task.getTotalErrors()).toBe(1);
  });

  it("resets failures and issue counters between executions", async () => {
    const runCommandSpy = vi
      .spyOn(helpers, "runCommand")
      .mockResolvedValueOnce({
        status: 1,
        stdout: "first failure",
        stderr: "",
      })
      .mockResolvedValueOnce({
        status: 0,
        stdout: "ok",
        stderr: "",
      });

    const task = createMockTask({
      parseFailure: (output) => {
        if (output.includes("first failure")) {
          return { message: "Failed - first run", errors: 3, warnings: 2 };
        }

        return undefined;
      },
    });

    await task.execute();
    expect(runCommandSpy).toHaveBeenCalledTimes(1);
    expect(task.getFailures()).toHaveLength(1);
    expect(task.getTotalErrors()).toBe(3);
    expect(task.getTotalWarnings()).toBe(2);

    await task.execute();
    expect(runCommandSpy).toHaveBeenCalledTimes(2);
    expect(task.getFailures()).toEqual([]);
    expect(task.getTotalErrors()).toBe(0);
    expect(task.getTotalWarnings()).toBe(0);
    expect(task.getStatus().state).toBe("success");
  });

  it("uses fallback message when parseFailure returns only counts", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 1,
      stdout: "bad output",
      stderr: "",
    });

    const task = createMockTask({
      parseFailure: () => {
        return {
          message: undefined,
          errors: 4,
          warnings: 1,
        } as unknown as ReturnType<Task["parseFailure"]>;
      },
    });

    await task.execute();

    expect(task.getStatus()).toEqual({
      state: "failure",
      message: "Failed - see output below for details",
    });
    expect(task.getFailures()[0]?.summary).toBeUndefined();
    expect(task.getTotalErrors()).toBe(4);
    expect(task.getTotalWarnings()).toBe(1);
  });

  it("uses generic failure details when command fails without parsed failure", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 1,
      stdout: "  output with spaces  ",
      stderr: "   ",
    });

    const task = createMockTask({
      parseFailure: () => {
        return undefined;
      },
    });

    await task.execute();

    expect(task.getStatus()).toEqual({
      state: "failure",
      message: "Failed - see output below for details",
    });
    expect(task.getFailures()).toEqual([
      {
        label: "Echo Task",
        tool: "Echo",
        command: "echo 'Echo command'",
        errors: undefined,
        warnings: undefined,
        summary: undefined,
        output: "output with spaces",
        rawOutput: "output with spaces",
      },
    ]);
    expect(task.getTotalErrors()).toBe(1);
    expect(task.getTotalWarnings()).toBe(0);
  });

  it("passes unsupported tools when the command exits successfully", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 0,
      stdout: "ok",
      stderr: "",
    });

    const task = createMockTask({
      usesExitCodeOnly: true,
      parseFailure: () => {
        return undefined;
      },
    });

    await task.execute();

    expect(task.getStatus()).toEqual({ state: "success", message: "Passed" });
    expect(task.getTotalErrors()).toBe(0);
    expect(task.getTotalWarnings()).toBe(0);
  });

  it("fails unsupported tools by exit code without synthetic issue counts", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 1,
      stdout: "failure output",
      stderr: "",
    });

    const task = createMockTask({
      usesExitCodeOnly: true,
      parseFailure: () => {
        return undefined;
      },
    });

    await task.execute();

    expect(task.getStatus()).toEqual({
      state: "failure",
      message: "Failed - see output below for details",
    });
    expect(task.getFailures()).toEqual([
      {
        label: "Echo Task",
        tool: "Echo",
        command: "echo 'Echo command'",
        errors: undefined,
        warnings: undefined,
        summary: undefined,
        output: "failure output",
        rawOutput: "failure output",
      },
    ]);
    expect(task.getTotalErrors()).toBe(0);
    expect(task.getTotalWarnings()).toBe(0);
  });

  it("tracks running status while command is in progress", async () => {
    let resolveRun: (() => void) | undefined;
    vi.spyOn(helpers, "runCommand").mockImplementation(() => {
      return new Promise((resolve) => {
        resolveRun = () => {
          resolve({ status: 0, stdout: "done", stderr: "" });
        };
      });
    });

    const task = createMockTask();
    const runPromise = task.execute({
      onStart: () => {
        expect(task.getStatus()).toEqual({
          state: "running",
          message: "Running...",
        });
        expect(task.getStartTime()).not.toBeNull();
        expect(task.getEndTime()).toBeNull();
        expect(task.getDuration()).toBeNull();
      },
    });

    resolveRun?.();
    await runPromise;

    expect(task.getStatus()).toEqual({ state: "success", message: "Passed" });
  });

  it("counts warnings without forcing a synthetic error", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 1,
      stdout: "warn only",
      stderr: "",
    });

    const task = createMockTask({
      parseFailure: () => {
        return { message: "Failed - 2 warnings", errors: 0, warnings: 2 };
      },
    });

    await task.execute();

    expect(task.getTotalErrors()).toBe(0);
    expect(task.getTotalWarnings()).toBe(2);
  });

  it("counts errors when warnings are zero", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 1,
      stdout: "errors only",
      stderr: "",
    });

    const task = createMockTask({
      parseFailure: () => {
        return { message: "Failed - 2 errors", errors: 2, warnings: 0 };
      },
    });

    await task.execute();

    expect(task.getTotalErrors()).toBe(2);
    expect(task.getTotalWarnings()).toBe(0);
  });

  it("passes stderr without leading newline when stdout is empty", async () => {
    const parseFailureMock = vi.fn(() => {
      return { message: "Failed - parsed", errors: 1 };
    });
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 1,
      stdout: "",
      stderr: "stderr-only",
    });

    const task = createMockTask({ parseFailure: parseFailureMock });
    await task.execute();

    expect(parseFailureMock).toHaveBeenCalledWith("stderr-only");
  });

  it("trims rawOutput fallback when command output is whitespace only", async () => {
    vi.spyOn(helpers, "runCommand").mockResolvedValue({
      status: 1,
      stdout: "   ",
      stderr: "",
    });

    const task = createMockTask({
      parseFailure: () => {
        return { message: "Failed - whitespace output", errors: 1 };
      },
    });

    await task.execute();

    expect(task.getFailures()[0]?.rawOutput).toBe("");
    expect(task.getFailures()[0]?.output).toBe("");
  });

  it("does not set end time when stopTimer runs without a start time", () => {
    type TaskInternals = {
      stopTimer: () => void;
      startTime: number | null;
      endTime: number | null;
    };
    const task = createMockTask() as unknown as TaskInternals;
    task.startTime = null;
    task.endTime = null;

    task.stopTimer();

    expect(task.endTime).toBeNull();
  });

  it("returns null duration when end time exists but start time is missing", () => {
    type TaskDurationInternals = {
      getDuration: () => number | null;
      startTime: number | null;
      endTime: number | null;
    };
    const task = createMockTask() as unknown as TaskDurationInternals;
    task.startTime = null;
    task.endTime = 1000;

    expect(task.getDuration()).toBeNull();
  });
});
