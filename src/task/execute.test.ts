import { afterEach, describe, expect, it, vi } from "vitest";

import { type Config } from "../config/types";
import { render } from "../renderers";
import { type RunOptions } from "../runOptions/types";

import { calculateTotalIssues, hasTaskFailures, runTasks } from "./execute";
import { Task } from "./task";
import { type TaskStatus } from "./types";

vi.mock("../renderers", () => {
  return {
    render: vi.fn(),
  };
});

const renderMock = vi.mocked(render);

const baseRunOptions: RunOptions = {
  isFixMode: false,
  isSilentMode: false,
  isWatchMode: false,
  isNoColor: false,
  configPath: undefined,
};

type MockExecute = ReturnType<typeof vi.fn>;
type ExecuteHooks = { onStart?: () => void; onFinish?: () => void };
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
    vi.fn(({ onStart, onFinish }: ExecuteHooks = {}) => {
      onStart?.();
      onFinish?.();
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

const createTaskDouble = (tool: string) => {
  const executeMock: MockExecute = vi.fn(
    ({ onStart, onFinish }: ExecuteHooks = {}) => {
      onStart?.();
      onFinish?.();
    }
  );
  const { task } = createMockedTask({
    tool,
    execute: executeMock,
  });

  return { task, executeMock };
};

describe("runTasks", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders before running tasks and whenever callbacks fire", async () => {
    const firstTask = createTaskDouble("first-tool");
    const secondTask = createTaskDouble("second-tool");
    const config: Config = {
      unsupportedTools: [],
      tasks: [firstTask.task, secondTask.task],
      executionMode: "parallel",
    };

    await runTasks(config, baseRunOptions);

    expect(renderMock).toHaveBeenCalledTimes(1 + config.tasks.length * 2);
    renderMock.mock.calls.forEach(([configArg, optionsArg]) => {
      expect(configArg).toBe(config);
      expect(optionsArg).toBe(baseRunOptions);
    });

    expect(firstTask.executeMock).toHaveBeenCalledTimes(1);
    expect(secondTask.executeMock).toHaveBeenCalledTimes(1);
  });

  it("resets tasks before the first render of each run", async () => {
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

    await runTasks(config, baseRunOptions);

    expect(firstTask.resetMock).toHaveBeenCalledTimes(1);
    expect(secondTask.resetMock).toHaveBeenCalledTimes(1);
    expect(resetEvents).toEqual(["first:reset", "second:reset"]);
    expect(renderMock).toHaveBeenNthCalledWith(1, config, baseRunOptions);
  });

  it("runs tasks sequentially when configured", async () => {
    let resolveFirst: (() => void) | undefined;
    const events: string[] = [];
    const firstExecuteMock = vi.fn(
      ({ onStart, onFinish }: ExecuteHooks = {}) => {
        events.push("first:start");
        onStart?.();

        return new Promise<void>((resolve) => {
          resolveFirst = () => {
            events.push("first:finish");
            onFinish?.();
            resolve();
          };
        });
      }
    );
    const secondExecuteMock = vi.fn(
      ({ onStart, onFinish }: ExecuteHooks = {}) => {
        events.push("second:start");
        onStart?.();
        events.push("second:finish");
        onFinish?.();
        return Promise.resolve();
      }
    );
    const config: Config = {
      executionMode: "sequential",
      unsupportedTools: [],
      tasks: [
        createMockedTask({ tool: "first", execute: firstExecuteMock }).task,
        createMockedTask({ tool: "second", execute: secondExecuteMock }).task,
      ],
    };

    const runPromise = runTasks(config, baseRunOptions);
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
    const firstExecuteMock = vi.fn(
      ({ onStart, onFinish }: ExecuteHooks = {}) => {
        events.push("first:start");
        onStart?.();

        return new Promise<void>((resolve) => {
          resolveFirst = () => {
            events.push("first:finish");
            onFinish?.();
            resolve();
          };
        });
      }
    );
    const secondExecuteMock = vi.fn(
      ({ onStart, onFinish }: ExecuteHooks = {}) => {
        events.push("second:start");
        onStart?.();

        return new Promise<void>((resolve) => {
          resolveSecond = () => {
            events.push("second:finish");
            onFinish?.();
            resolve();
          };
        });
      }
    );
    const config: Config = {
      executionMode: "parallel",
      unsupportedTools: [],
      tasks: [
        createMockedTask({ tool: "first", execute: firstExecuteMock }).task,
        createMockedTask({ tool: "second", execute: secondExecuteMock }).task,
      ],
    };

    const runPromise = runTasks(config, baseRunOptions);
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

    const firstExecuteMock = vi.fn(
      ({ onStart, onFinish }: ExecuteHooks = {}) => {
        events.push("first:start");
        onStart?.();

        return new Promise<void>((resolve) => {
          resolveFirst = () => {
            events.push("first:finish");
            onFinish?.();
            resolve();
          };
        });
      }
    );
    const secondExecuteMock = vi.fn(
      ({ onStart, onFinish }: ExecuteHooks = {}) => {
        events.push("second:start");
        onStart?.();
        events.push("second:finish");
        onFinish?.();
        return Promise.resolve();
      }
    );

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

    const runPromise = runTasks(config, baseRunOptions);
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
      return vi.fn(({ onStart, onFinish }: ExecuteHooks = {}) => {
        events.push(`${name}:start`);
        onStart?.();
        events.push(`${name}:finish`);
        onFinish?.();
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

    await runTasks(config, baseRunOptions);

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

  it("does not run a task until all of its dependencies complete in parallel mode", async () => {
    let resolveFirst: (() => void) | undefined;
    let resolveSecond: (() => void) | undefined;
    const events: string[] = [];

    const makeAsyncMock = (
      name: string,
      resolver: (fn: () => void) => void
    ) => {
      return vi.fn(({ onStart, onFinish }: ExecuteHooks = {}) => {
        events.push(`${name}:start`);
        onStart?.();
        return new Promise<void>((resolve) => {
          resolver(() => {
            events.push(`${name}:finish`);
            onFinish?.();
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
    const thirdMock = vi.fn(({ onStart, onFinish }: ExecuteHooks = {}) => {
      events.push("third:start");
      onStart?.();
      events.push("third:finish");
      onFinish?.();
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

    const runPromise = runTasks(config, baseRunOptions);
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

    // A fails; B and C both depend on A; D depends on both B and C.
    // D should only be cancelled once even though it is reachable via both B and C.
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

    await runTasks(config, baseRunOptions);

    expect(cancelMockD).toHaveBeenCalledTimes(1);
  });

  it("does not resolve the parallel promise until all in-flight tasks complete", async () => {
    let resolveFirst: (() => void) | undefined;
    let resolveSecond: (() => void) | undefined;

    const firstMock = vi.fn(({ onStart, onFinish }: ExecuteHooks = {}) => {
      onStart?.();
      return new Promise<void>((resolve) => {
        resolveFirst = () => {
          onFinish?.();
          resolve();
        };
      });
    });
    const secondMock = vi.fn(({ onStart, onFinish }: ExecuteHooks = {}) => {
      onStart?.();
      return new Promise<void>((resolve) => {
        resolveSecond = () => {
          onFinish?.();
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

    const runPromise = runTasks(config, baseRunOptions);
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

    await runTasks(config, baseRunOptions);

    expect(failingExecuteMock).toHaveBeenCalledTimes(1);
    expect(dependentExecuteMock).not.toHaveBeenCalled();
    expect(cancelMock).toHaveBeenCalledTimes(1);
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

  it("returns false when no task has failed", () => {
    const tasks = [
      createMockedTask({
        tool: "success",
        status: { state: "success", message: "Passed" },
      }).task,
      createMockedTask({
        tool: "running",
        status: { state: "running", message: "Running..." },
      }).task,
    ];

    expect(hasTaskFailures(tasks)).toBe(false);
  });
});
