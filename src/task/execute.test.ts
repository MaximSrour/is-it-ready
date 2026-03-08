import { afterEach, describe, expect, it, vi } from "vitest";

import { type Config } from "../config/types";
import { render } from "../renderers";
import { type RunOptions } from "../runOptions/types";

import { calculateTotalIssues, hasTaskFailures, runTasks } from "./execute";
import { Task } from "./task";

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

const createTaskDouble = (tool: string) => {
  const executeMock: MockExecute = vi.fn(
    ({
      onStart,
      onFinish,
    }: { onStart?: () => void; onFinish?: () => void } = {}) => {
      onStart?.();
      onFinish?.();
    }
  );

  const taskBase = new Task(
    {
      label: tool,
      tool,
      command: "echo 'test'",
      parseFailure: () => {
        return undefined;
      },
    },
    baseRunOptions
  );

  const task: Task = Object.assign(taskBase, {
    execute: executeMock,
    getTotalErrors: vi.fn().mockReturnValue(0),
    getTotalWarnings: vi.fn().mockReturnValue(0),
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
});

describe("calculateTotalIssues", () => {
  it("sums errors and warnings across all tasks", () => {
    const createIssueTask = (errors: number, warnings: number) => {
      return {
        getTotalErrors: () => {
          return errors;
        },
        getTotalWarnings: () => {
          return warnings;
        },
      } as unknown as Task;
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
      {
        getStatus: () => {
          return { state: "success", message: "Passed" };
        },
      },
      {
        getStatus: () => {
          return { state: "failure", message: "Failed" };
        },
      },
    ] as unknown as Task[];

    expect(hasTaskFailures(tasks)).toBe(true);
  });

  it("returns false when no task has failed", () => {
    const tasks = [
      {
        getStatus: () => {
          return { state: "success", message: "Passed" };
        },
      },
      {
        getStatus: () => {
          return { state: "running", message: "Running..." };
        },
      },
    ] as unknown as Task[];

    expect(hasTaskFailures(tasks)).toBe(false);
  });
});
