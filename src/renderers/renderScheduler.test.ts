import { afterEach, describe, expect, it, vi } from "vitest";

import { type Config } from "../config/types";
import { type RunOptions } from "../runOptions/types";

import { render } from "./render";
import { RENDER_INTERVAL_MS, startRenderer } from "./renderScheduler";

vi.mock("./render", () => {
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

const baseConfig: Config = {
  tasks: [],
  unsupportedTools: [],
  executionMode: "parallel",
};

describe("startRenderer", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("starts a 100 ms interval in TTY mode and renders on each tick", () => {
    vi.useFakeTimers();
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: true,
    });

    const stop = startRenderer(baseConfig, baseRunOptions);

    expect(renderMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(RENDER_INTERVAL_MS - 1);
    expect(renderMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(renderMock).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(RENDER_INTERVAL_MS);
    expect(renderMock).toHaveBeenCalledTimes(3);

    stop();
  });

  it("does not start an interval when stdout is not a TTY", () => {
    vi.useFakeTimers();
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: false,
    });

    const stop = startRenderer(baseConfig, baseRunOptions);

    vi.advanceTimersByTime(RENDER_INTERVAL_MS * 3);

    expect(renderMock).toHaveBeenCalledTimes(1);
    expect(stop).toBeTypeOf("function");

    stop();
    expect(renderMock).toHaveBeenCalledTimes(2);
  });

  it("stops rendering after cleanup", () => {
    vi.useFakeTimers();
    Object.defineProperty(process.stdout, "isTTY", {
      configurable: true,
      value: true,
    });

    const stop = startRenderer(baseConfig, baseRunOptions);

    vi.advanceTimersByTime(RENDER_INTERVAL_MS);
    expect(renderMock).toHaveBeenCalledTimes(2);

    stop();
    vi.advanceTimersByTime(RENDER_INTERVAL_MS * 2);

    expect(renderMock).toHaveBeenCalledTimes(3);
  });
});
