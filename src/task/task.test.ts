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
    expect(runCommandSpy).toHaveBeenCalledWith("echo 'Echo command'");
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
    expect(runCommandSpy).toHaveBeenCalledWith("echo 'Echo command fix'");
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

    expect(runCommandSpy).toHaveBeenCalledWith("echo 'Echo command'");
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
    expect(runCommandSpy).toHaveBeenCalledWith("echo 'Echo command'");
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(commandOutput.trim()).toBe("Echo command");
  });
});
