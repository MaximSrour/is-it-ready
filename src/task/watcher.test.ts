import { type Config } from "src/config/types";
import {
  type MockInstance,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { startWatcher } from "./watcher";

const { watchMock, runMock, hasTaskFailuresMock } = vi.hoisted(() => {
  return {
    watchMock: vi.fn(),
    runMock: vi.fn(),
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
    hasTaskFailures: hasTaskFailuresMock,
  };
});

type FileChangeHandler = (() => void) | undefined;

describe("startWatcher", () => {
  let watcher: {
    on: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };
  let fileChangeHandler: FileChangeHandler;

  beforeEach(() => {
    watchMock.mockReset();
    runMock.mockReset();
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

  it("uses default ignore patterns and handles change events", () => {
    const config: Config = {
      unsupportedTools: [],
      tasks: [],
      executionMode: "parallel",
    };

    startWatcher(config, runMock);

    expect(watchMock).toHaveBeenCalledWith(".", {
      ignored: ["**/node_modules/**", "**/.git/**"],
      persistent: true,
      ignoreInitial: true,
    });

    expect(fileChangeHandler).toBeDefined();
    fileChangeHandler?.();
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith();
  });

  it("prevents overlapping change handling while work is executing", async () => {
    const config: Config = {
      unsupportedTools: [],
      tasks: [],
      executionMode: "parallel",
    };
    let resolveRun: (() => void) | undefined;

    runMock.mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveRun = resolve;
      });
    });

    startWatcher(config, runMock);
    expect(fileChangeHandler).toBeDefined();

    fileChangeHandler?.();
    fileChangeHandler?.();

    expect(runMock).toHaveBeenCalledTimes(1);

    resolveRun?.();
    await Promise.resolve();

    fileChangeHandler?.();
    expect(runMock).toHaveBeenCalledTimes(2);
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

    startWatcher(config, runMock);

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
