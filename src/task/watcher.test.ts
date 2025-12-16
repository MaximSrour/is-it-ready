import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Config } from "~/config/types";
import { type RunOptions } from "~/runOptions/types";

import { startWatcher } from "./watcher";

const { watchMock, runTasksMock, calculateTotalIssuesMock } = vi.hoisted(() => {
  return {
    watchMock: vi.fn(),
    runTasksMock: vi.fn(),
    calculateTotalIssuesMock: vi.fn(),
  };
});

vi.mock("chokidar", () => {
  return {
    default: {
      watch: watchMock,
    },
  };
});

vi.mock("./execute", () => {
  return {
    runTasks: runTasksMock,
    calculateTotalIssues: calculateTotalIssuesMock,
  };
});

const baseRunOptions: RunOptions = {
  isFixMode: false,
  isSilentMode: false,
  isWatchMode: true,
  configPath: undefined,
};

type FileChangeHandler = (() => void) | undefined;

describe("startWatcher", () => {
  let watcher: {
    on: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };
  let fileChangeHandler: FileChangeHandler;

  beforeEach(() => {
    watchMock.mockReset();
    runTasksMock.mockReset();
    calculateTotalIssuesMock.mockReset();

    fileChangeHandler = undefined;
    watcher = {
      on: vi.fn(
        (
          event: string,
          handler: (...args: unknown[]) => void
        ): typeof watcher => {
          if (event === "all") {
            fileChangeHandler = () => {
              handler();
            };
          }

          return watcher;
        }
      ),
      close: vi.fn().mockResolvedValue(undefined),
    };

    watchMock.mockReturnValue(watcher);
  });

  it("uses default ignore patterns and reruns tasks on change events", () => {
    const config = {
      tasks: [],
    } as Config;

    startWatcher(config, baseRunOptions);

    expect(watchMock).toHaveBeenCalledWith(".", {
      ignored: ["**/node_modules/**", "**/.git/**"],
      persistent: true,
      ignoreInitial: true,
    });

    expect(fileChangeHandler).toBeDefined();
    fileChangeHandler?.();
    expect(runTasksMock).toHaveBeenCalledTimes(1);
    expect(runTasksMock).toHaveBeenCalledWith(config, baseRunOptions);
  });

  it("prevents overlapping reruns while tasks are executing", async () => {
    const config = {
      tasks: [],
    } as Config;
    let resolveRun: (() => void) | undefined;

    runTasksMock.mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveRun = resolve;
      });
    });

    startWatcher(config, baseRunOptions);
    expect(fileChangeHandler).toBeDefined();

    fileChangeHandler?.();
    fileChangeHandler?.();

    expect(runTasksMock).toHaveBeenCalledTimes(1);

    resolveRun?.();
    await Promise.resolve();

    fileChangeHandler?.();
    expect(runTasksMock).toHaveBeenCalledTimes(2);
  });

  it("closes the watcher and exits with correct status when interrupted", () => {
    const config = {
      tasks: [],
    } as Config;
    calculateTotalIssuesMock.mockReturnValueOnce(2).mockReturnValueOnce(0);

    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      return undefined;
    }) as never);
    const signalHandlers: Record<string, () => void> = {};
    const onSpy = vi.spyOn(process, "on").mockImplementation(((
      event: string,
      handler: () => void
    ) => {
      signalHandlers[event] = handler;

      return process;
    }) as typeof process.on);

    startWatcher(config, baseRunOptions);

    signalHandlers.SIGINT();
    expect(watcher.close).toHaveBeenCalledTimes(1);
    expect(calculateTotalIssuesMock).toHaveBeenCalledWith(config.tasks);
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockClear();
    signalHandlers.SIGTERM();
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(watcher.close).toHaveBeenCalledTimes(2);

    onSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
