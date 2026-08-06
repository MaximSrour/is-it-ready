import { afterEach, describe, expect, it, vi } from "vitest";

import { type Config } from "../config/types";
import { type RunOptions } from "../runOptions/types";

import { calculateTotalIssues, hasTaskFailures, runTasks } from "./execute";
import { Task } from "./task";
import { type TaskStatus } from "./types";

const baseRunOptions: RunOptions = {
  isFixMode: false,
  isSilentMode: false,
  isWatchMode: false,
  isNoColor: false,
  configPath: undefined,
};

type MockExecute = ReturnType<typeof vi.fn>;
type TaskDoubleOptions = {
  tool: string;
  dependsOn?: readonly string[];
  execute?: MockExecute;
  status?: TaskStatus;
  cancel?: () => void;
  reset?: () => void;
  totalErrors?: number;
  totalWarnings?: number;
};

const createMockedTask = ({
  tool,
  dependsOn = [],
  execute,
  status = { state: "success", message: "" },
  cancel,
  reset,
  totalErrors = 0,
  totalWarnings = 0,
}: TaskDoubleOptions) => {
  const executeMock: MockExecute =
    execute ??
    vi.fn(() => {
      return Promise.resolve();
    });
  const cancelMock = vi.fn(() => {
    cancel?.();
  });
  const resetMock = vi.fn(() => {
    reset?.();
  });

  const taskBase = new Task(
    {
      label: tool,
      tool,
      command: "echo 'test'",
      dependsOn,
      parseFailure: () => {
        return undefined;
      },
    },
    baseRunOptions
  );

  const task: Task = Object.assign(taskBase, {
    execute: executeMock,
    getStatus: () => {
      return status;
    },
    cancel: cancelMock,
    reset: resetMock,
    getTotalErrors: vi.fn().mockReturnValue(totalErrors),
    getTotalWarnings: vi.fn().mockReturnValue(totalWarnings),
  });

  return { task, executeMock, cancelMock, resetMock };
};

describe("runTasks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("resets tasks before execution begins", async () => {
    const resetEvents: string[] = [];
    const firstTask = createMockedTask({
      tool: "first",
      reset: () => {
        resetEvents.push("first:reset");
      },
    });
    const secondTask = createMockedTask({
      tool: "second",
      reset: () => {
        resetEvents.push("second:reset");
      },
    });
    const config: Config = {
      unsupportedTools: [],
      tasks: [firstTask.task, secondTask.task],
      executionMode: "parallel",
    };

    await runTasks(config);

    expect(firstTask.resetMock).toHaveBeenCalledTimes(1);
    expect(secondTask.resetMock).toHaveBeenCalledTimes(1);
    expect(resetEvents).toEqual(["first:reset", "second:reset"]);
  });

  it("runs tasks sequentially when configured", async () => {
    let resolveFirst: (() => void) | undefined;
    const events: string[] = [];
    const firstExecuteMock = vi.fn(() => {
      events.push("first:start");

      return new Promise<void>((resolve) => {
        resolveFirst = () => {
          events.push("first:finish");
          resolve();
        };
      });
    });
    const secondExecuteMock = vi.fn(() => {
      events.push("second:start");
      events.push("second:finish");
      return Promise.resolve();
    });
    const config: Config = {
      executionMode: "sequential",
      unsupportedTools: [],
      tasks: [
        createMockedTask({ tool: "first", execute: firstExecuteMock }).task,
        createMockedTask({ tool: "second", execute: secondExecuteMock }).task,
      ],
    };

    const runPromise = runTasks(config);
    await Promise.resolve();

    expect(firstExecuteMock).toHaveBeenCalledTimes(1);
    expect(secondExecuteMock).not.toHaveBeenCalled();

    resolveFirst?.();
    await runPromise;

    expect(secondExecuteMock).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      "first:start",
      "first:finish",
      "second:start",
      "second:finish",
    ]);
  });

  it("runs tasks in parallel by default", async () => {
    let resolveFirst: (() => void) | undefined;
    let resolveSecond: (() => void) | undefined;
    const events: string[] = [];
    const firstExecuteMock = vi.fn(() => {
      events.push("first:start");

      return new Promise<void>((resolve) => {
        resolveFirst = () => {
          events.push("first:finish");
          resolve();
        };
      });
    });
    const secondExecuteMock = vi.fn(() => {
      events.push("second:start");

      return new Promise<void>((resolve) => {
        resolveSecond = () => {
          events.push("second:finish");
          resolve();
        };
      });
    });
    const config: Config = {
      executionMode: "parallel",
      unsupportedTools: [],
      tasks: [
        createMockedTask({ tool: "first", execute: firstExecuteMock }).task,
        createMockedTask({ tool: "second", execute: secondExecuteMock }).task,
      ],
    };

    const runPromise = runTasks(config);
    await Promise.resolve();

    expect(firstExecuteMock).toHaveBeenCalledTimes(1);
    expect(secondExecuteMock).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["first:start", "second:start"]);

    resolveFirst?.();
    resolveSecond?.();
    await runPromise;
  });

  it("respects dependsOn in parallel mode", async () => {
    let resolveFirst: (() => void) | undefined;
    const events: string[] = [];

    const firstExecuteMock = vi.fn(() => {
      events.push("first:start");

      return new Promise<void>((resolve) => {
        resolveFirst = () => {
          events.push("first:finish");
          resolve();
        };
      });
    });
    const secondExecuteMock = vi.fn(() => {
      events.push("second:start");
      events.push("second:finish");
      return Promise.resolve();
    });

    const firstTask = createMockedTask({
      tool: "first",
      execute: firstExecuteMock,
    }).task;
    const secondTask = createMockedTask({
      tool: "second",
      dependsOn: ["first"],
      execute: secondExecuteMock,
    }).task;

    const config: Config = {
      executionMode: "parallel",
      unsupportedTools: [],
      tasks: [firstTask, secondTask],
    };

    const runPromise = runTasks(config);
    await Promise.resolve();

    expect(firstExecuteMock).toHaveBeenCalledTimes(1);
    expect(secondExecuteMock).not.toHaveBeenCalled();

    resolveFirst?.();
    await runPromise;

    expect(secondExecuteMock).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      "first:start",
      "first:finish",
      "second:start",
      "second:finish",
    ]);
  });

  it("respects dependsOn in sequential mode", async () => {
    const events: string[] = [];

    const makeExecuteMock = (name: string) => {
      return vi.fn(() => {
        events.push(`${name}:start`);
        events.push(`${name}:finish`);
        return Promise.resolve();
      });
    };

    const prettierMock = makeExecuteMock("prettier");
    const eslintMock = makeExecuteMock("eslint");
    const tscMock = makeExecuteMock("tsc");
    const vitestMock = makeExecuteMock("vitest");

    const config: Config = {
      executionMode: "sequential",
      unsupportedTools: [],
      tasks: [
        createMockedTask({ tool: "Prettier", execute: prettierMock }).task,
        createMockedTask({
          tool: "ESLint",
          dependsOn: ["Prettier"],
          execute: eslintMock,
        }).task,
        createMockedTask({
          tool: "TypeScript",
          dependsOn: ["Prettier"],
          execute: tscMock,
        }).task,
        createMockedTask({
          tool: "Vitest",
          dependsOn: ["ESLint", "TypeScript"],
          execute: vitestMock,
        }).task,
      ],
    };

    await runTasks(config);

    expect(events.indexOf("prettier:finish")).toBeLessThan(
      events.indexOf("eslint:start")
    );
    expect(events.indexOf("prettier:finish")).toBeLessThan(
      events.indexOf("tsc:start")
    );
    expect(events.indexOf("eslint:finish")).toBeLessThan(
      events.indexOf("vitest:start")
    );
    expect(events.indexOf("tsc:finish")).toBeLessThan(
      events.indexOf("vitest:start")
    );

    expect(prettierMock).toHaveBeenCalledTimes(1);
    expect(eslintMock).toHaveBeenCalledTimes(1);
    expect(tscMock).toHaveBeenCalledTimes(1);
    expect(vitestMock).toHaveBeenCalledTimes(1);
  });

  it("prefers the earliest runnable task in file order in sequential mode", async () => {
    const events: string[] = [];

    const makeExecuteMock = (name: string) => {
      return vi.fn(() => {
        events.push(`${name}:start`);
        events.push(`${name}:finish`);
        return Promise.resolve();
      });
    };

    const taskAMock = makeExecuteMock("A");
    const taskBMock = makeExecuteMock("B");
    const taskCMock = makeExecuteMock("C");

    const config: Config = {
      executionMode: "sequential",
      unsupportedTools: [],
      tasks: [
        createMockedTask({
          tool: "A",
          dependsOn: ["B"],
          execute: taskAMock,
        }).task,
        createMockedTask({ tool: "B", execute: taskBMock }).task,
        createMockedTask({ tool: "C", execute: taskCMock }).task,
      ],
    };

    await runTasks(config);

    expect(events).toEqual([
      "B:start",
      "B:finish",
      "A:start",
      "A:finish",
      "C:start",
      "C:finish",
    ]);
  });

  it("does not run a task until all of its dependencies complete in parallel mode", async () => {
    let resolveFirst: (() => void) | undefined;
    let resolveSecond: (() => void) | undefined;
    const events: string[] = [];

    const makeAsyncMock = (
      name: string,
      resolver: (fn: () => void) => void
    ) => {
      return vi.fn(() => {
        events.push(`${name}:start`);
        return new Promise<void>((resolve) => {
          resolver(() => {
            events.push(`${name}:finish`);
            resolve();
          });
        });
      });
    };

    const firstMock = makeAsyncMock("first", (fn) => {
      resolveFirst = fn;
    });
    const secondMock = makeAsyncMock("second", (fn) => {
      resolveSecond = fn;
    });
    const thirdMock = vi.fn(() => {
      events.push("third:start");
      events.push("third:finish");
      return Promise.resolve();
    });

    const config: Config = {
      executionMode: "parallel",
      unsupportedTools: [],
      tasks: [
        createMockedTask({ tool: "first", execute: firstMock }).task,
        createMockedTask({ tool: "second", execute: secondMock }).task,
        createMockedTask({
          tool: "third",
          dependsOn: ["first", "second"],
          execute: thirdMock,
        }).task,
      ],
    };

    const runPromise = runTasks(config);
    await Promise.resolve();

    expect(firstMock).toHaveBeenCalledTimes(1);
    expect(secondMock).toHaveBeenCalledTimes(1);
    expect(thirdMock).not.toHaveBeenCalled();

    resolveFirst?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(thirdMock).not.toHaveBeenCalled();

    resolveSecond?.();
    await runPromise;

    expect(thirdMock).toHaveBeenCalledTimes(1);
    expect(events.indexOf("first:finish")).toBeLessThan(
      events.indexOf("third:start")
    );
    expect(events.indexOf("second:finish")).toBeLessThan(
      events.indexOf("third:start")
    );
  });

  it("cancels a shared dependent only once when multiple dependencies fail", async () => {
    const cancelMockD = vi.fn();

    const makeTask = (tool: string, dependsOn: string[], state = "pending") => {
      return createMockedTask({
        tool,
        dependsOn,
        execute: vi.fn(),
        status: { state, message: "" } as TaskStatus,
      }).task;
    };

    const taskA = createMockedTask({
      tool: "A",
      execute: vi.fn(() => {
        return Promise.resolve();
      }),
      status: { state: "failure", message: "Failed" },
    }).task;
    const taskB = makeTask("B", ["A"]);
    const taskC = makeTask("C", ["A"]);
    const taskD = createMockedTask({
      tool: "D",
      dependsOn: ["B", "C"],
      execute: vi.fn(),
      status: { state: "pending", message: "" },
      cancel: cancelMockD,
    }).task;

    const config: Config = {
      executionMode: "parallel",
      unsupportedTools: [],
      tasks: [taskA, taskB, taskC, taskD],
    };

    await runTasks(config);

    expect(cancelMockD).toHaveBeenCalledTimes(1);
  });

  it("does not resolve the parallel promise until all in-flight tasks complete", async () => {
    let resolveFirst: (() => void) | undefined;
    let resolveSecond: (() => void) | undefined;

    const firstMock = vi.fn(() => {
      return new Promise<void>((resolve) => {
        resolveFirst = () => {
          resolve();
        };
      });
    });
    const secondMock = vi.fn(() => {
      return new Promise<void>((resolve) => {
        resolveSecond = () => {
          resolve();
        };
      });
    });

    const config: Config = {
      executionMode: "parallel",
      unsupportedTools: [],
      tasks: [
        createMockedTask({ tool: "first", execute: firstMock }).task,
        createMockedTask({ tool: "second", execute: secondMock }).task,
      ],
    };

    const runPromise = runTasks(config);
    await Promise.resolve();

    let finished = false;
    void runPromise.then(() => {
      finished = true;
    });

    resolveFirst?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(finished).toBe(false);
    await expect(
      Promise.race([
        runPromise.then(() => {
          return "resolved";
        }),
        new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve("pending");
          }, 0);
        }),
      ])
    ).resolves.toBe("pending");

    resolveSecond?.();
    await runPromise;

    expect(finished).toBe(true);
  });

  it("cancels dependents when a task fails", async () => {
    const cancelMock = vi.fn();
    const failingExecuteMock = vi.fn(() => {
      return Promise.resolve();
    });

    const failingTask = createMockedTask({
      tool: "Prettier",
      execute: failingExecuteMock,
      status: { state: "failure", message: "Failed" },
    }).task;

    const dependentExecuteMock = vi.fn();
    const dependentTask = createMockedTask({
      tool: "ESLint",
      dependsOn: ["Prettier"],
      execute: dependentExecuteMock,
      status: { state: "pending", message: "" },
      cancel: cancelMock,
    }).task;

    const config: Config = {
      executionMode: "parallel",
      unsupportedTools: [],
      tasks: [failingTask, dependentTask],
    };

    await runTasks(config);

    expect(failingExecuteMock).toHaveBeenCalledTimes(1);
    expect(dependentExecuteMock).not.toHaveBeenCalled();
    expect(cancelMock).toHaveBeenCalledTimes(1);
  });

  it("cancels dependents when a task fails in sequential mode", async () => {
    const cancelMock = vi.fn();
    const failingExecuteMock = vi.fn(() => {
      return Promise.resolve();
    });

    const failingTask = createMockedTask({
      tool: "Prettier",
      execute: failingExecuteMock,
      status: { state: "failure", message: "Failed" },
    }).task;

    const dependentExecuteMock = vi.fn();
    const dependentTask = createMockedTask({
      tool: "ESLint",
      dependsOn: ["Prettier"],
      execute: dependentExecuteMock,
      status: { state: "pending", message: "" },
      cancel: cancelMock,
    }).task;

    const config: Config = {
      executionMode: "sequential",
      unsupportedTools: [],
      tasks: [failingTask, dependentTask],
    };

    await runTasks(config);

    expect(failingExecuteMock).toHaveBeenCalledTimes(1);
    expect(dependentExecuteMock).not.toHaveBeenCalled();
    expect(cancelMock).toHaveBeenCalledTimes(1);
  });

  it("throws in sequential mode when no runnable task can be found", async () => {
    const config: Config = {
      executionMode: "sequential",
      unsupportedTools: [],
      tasks: [
        createMockedTask({
          tool: "A",
          dependsOn: ["B"],
          execute: vi.fn(),
        }).task,
        createMockedTask({
          tool: "B",
          dependsOn: ["A"],
          execute: vi.fn(),
        }).task,
      ],
    };

    await expect(runTasks(config)).rejects.toThrowError(
      /could not find a runnable task/i
    );
  });
});

describe("calculateTotalIssues", () => {
  it("sums errors and warnings across all tasks", () => {
    const createIssueTask = (errors: number, warnings: number) => {
      return createMockedTask({
        tool: `task-${errors}-${warnings}`,
        totalErrors: errors,
        totalWarnings: warnings,
      }).task;
    };

    const tasks = [
      createIssueTask(1, 0),
      createIssueTask(0, 2),
      createIssueTask(3, 1),
    ];

    expect(calculateTotalIssues(tasks)).toBe(7);
  });
});

describe("hasTaskFailures", () => {
  it("returns true when any task status is failure even without counted issues", () => {
    const tasks = [
      createMockedTask({
        tool: "success",
        status: { state: "success", message: "Passed" },
      }).task,
      createMockedTask({
        tool: "failure",
        status: { state: "failure", message: "Failed" },
      }).task,
    ];

    expect(hasTaskFailures(tasks)).toBe(true);
  });

  it("returns true when any task status is cancelled", () => {
    const tasks = [
      createMockedTask({
        tool: "success",
        status: { state: "success", message: "Passed" },
      }).task,
      createMockedTask({
        tool: "cancelled",
        status: { state: "cancelled", message: "Cancelled" },
      }).task,
    ];

    expect(hasTaskFailures(tasks)).toBe(true);
  });

  it("returns false when no task has failed", () => {
    const tasks = [
      createMockedTask({
        tool: "success",
        status: { state: "success", message: "Passed" },
      }).task,
      createMockedTask({
        tool: "also-success",
        status: { state: "success", message: "Passed" },
      }).task,
    ];

    expect(hasTaskFailures(tasks)).toBe(false);
  });
});
