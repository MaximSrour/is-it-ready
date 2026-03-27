import { type Config } from "src/config/types";
import {
  type MockInstance,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { type RunOptions } from "../runOptions/types";

import { startWatcher } from "./watcher";

const { watchMock, runTasksMock, hasTaskFailuresMock } = vi.hoisted(() => {
  return {
    watchMock: vi.fn(),
    runTasksMock: vi.fn(),
    hasTaskFailuresMock: vi.fn(),
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
    hasTaskFailures: hasTaskFailuresMock,
  };
});

const baseRunOptions: RunOptions = {
  isFixMode: false,
  isSilentMode: false,
  isWatchMode: true,
  isNoColor: false,
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
    hasTaskFailuresMock.mockReset();

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
    const config: Config = {
      unsupportedTools: [],
      tasks: [],
      executionMode: "parallel",
    };

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
    const config: Config = {
      unsupportedTools: [],
      tasks: [],
      executionMode: "parallel",
    };
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
    const config: Config = {
      unsupportedTools: [],
      tasks: [],
      executionMode: "parallel",
    };
    hasTaskFailuresMock.mockReturnValueOnce(true).mockReturnValueOnce(false);

    const exitSpy: MockInstance<typeof process.exit> = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {
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
    expect(hasTaskFailuresMock).toHaveBeenCalledWith(config.tasks);
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockClear();
    signalHandlers.SIGTERM();
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(watcher.close).toHaveBeenCalledTimes(2);

    onSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
