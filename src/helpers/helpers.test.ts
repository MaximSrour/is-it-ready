import {
  type ChildProcess,
  type SpawnOptions,
  spawn,
} from "node:child_process";
import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { type RunOptions } from "../runOptions/types";
import { type TaskConfig } from "../task/types";

import {
  addSilentFlag,
  decorateLabel,
  formatDuration,
  runCommand,
  selectCommand,
  stripAnsi,
} from "./helpers";

vi.mock("node:child_process", () => {
  return {
    spawn: vi.fn(),
  };
});

describe("decorateLabel", () => {
  it("appends asterisk", () => {
    expect(decorateLabel("Linting")).toBe("Linting*");
  });
});

describe("selectCommand", () => {
  const baseCommand = "npm run lint";
  const fixCommand = "npm run lint:fix";

  const makeOptions = (isFix: boolean): RunOptions => {
    return {
      isFixMode: isFix,
      isSilentMode: false,
      isWatchMode: false,
      isNoColor: false,
      configPath: undefined,
    };
  };

  it("returns fix command when fix mode enabled", () => {
    const config: TaskConfig = {
      label: "Linting",
      tool: "ESLint",
      command: baseCommand,
      fixCommand,
    } as TaskConfig;

    const result = selectCommand(config, makeOptions(true));

    expect(result.command).toBe(fixCommand);
    expect(result.label).toBe("Linting*");
  });

  it("falls back to base when fix mode enabled but no fix command", () => {
    const config: TaskConfig = {
      label: "Linting",
      tool: "ESLint",
      command: baseCommand,
      fixCommand: undefined,
    } as TaskConfig;

    const result = selectCommand(config, makeOptions(true));

    expect(result.command).toBe(baseCommand);
    expect(result.label).toBe("Linting");
  });

  it("returns base command when no flags enabled", () => {
    const config: TaskConfig = {
      label: "Linting",
      tool: "ESLint",
      command: baseCommand,
    } as TaskConfig;

    const result = selectCommand(config, makeOptions(false));

    expect(result.command).toBe(baseCommand);
    expect(result.label).toBe("Linting");
  });
});

describe("runCommand", () => {
  const spawnMock = vi.mocked(spawn);

  const restoreEnv = (originalEnv: NodeJS.ProcessEnv) => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  };

  const createMockChild = (): ChildProcess => {
    const stdout = new EventEmitter() as EventEmitter & {
      setEncoding: (encoding: string) => void;
    };
    const stderr = new EventEmitter() as EventEmitter & {
      setEncoding: (encoding: string) => void;
    };
    stdout.setEncoding = vi.fn();
    stderr.setEncoding = vi.fn();

    return Object.assign(new EventEmitter(), {
      stdout,
      stderr,
    }) as ChildProcess;
  };

  beforeEach(() => {
    spawnMock.mockReset();
  });

  it("throws when command is empty", async () => {
    await expect(runCommand("  ")).rejects.toThrow(/No command configured/);
  });

  it("sets no-color env when enabled", async () => {
    const originalEnv = { ...process.env };
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    delete process.env.npm_config_color;

    const child = createMockChild();
    spawnMock.mockReturnValue(child);

    const promise = runCommand("npm run lint", {
      isFixMode: false,
      isSilentMode: false,
      isWatchMode: false,
      isNoColor: true,
      configPath: undefined,
    });

    expect(spawnMock).toHaveBeenCalledOnce();
    const options = spawnMock.mock.calls[0][1] as SpawnOptions;
    const env = options.env ?? ({} as NodeJS.ProcessEnv);
    child.emit("close", 0);
    await promise;

    expect(env.NO_COLOR).toBe("1");
    expect(env.FORCE_COLOR).toBe("0");
    expect(env.npm_config_color).toBe("never");

    restoreEnv(originalEnv);
  });

  it("defaults color env when no-color disabled", async () => {
    const originalEnv = { ...process.env };
    const initialNoColor = process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    delete process.env.npm_config_color;

    const child = createMockChild();
    spawnMock.mockReturnValue(child);

    const promise = runCommand("npm run lint", {
      isFixMode: false,
      isSilentMode: false,
      isWatchMode: false,
      isNoColor: false,
      configPath: undefined,
    });

    expect(spawnMock).toHaveBeenCalledOnce();
    const options = spawnMock.mock.calls[0][1] as SpawnOptions;
    const env = options.env ?? ({} as NodeJS.ProcessEnv);
    child.emit("close", 0);
    await promise;

    expect(env.NO_COLOR).toBe(initialNoColor);
    expect(env.FORCE_COLOR).toBe("1");
    expect(env.npm_config_color).toBe("always");

    restoreEnv(originalEnv);
  });
});

describe("addSilentFlag", () => {
  it("returns non-npm commands untouched", () => {
    expect(addSilentFlag("pnpm lint")).toBe("pnpm lint");
  });

  it("inserts --silent into npm run invocations", () => {
    expect(addSilentFlag("npm run lint")).toBe("npm run --silent lint");
  });

  it("does not duplicate --silent when already present", () => {
    expect(addSilentFlag("npm run --silent lint")).toBe(
      "npm run --silent lint"
    );
  });

  it("preserves additional arguments", () => {
    expect(addSilentFlag("npm run lint -- --fix")).toBe(
      "npm run --silent lint -- --fix"
    );
  });
});

describe("stripAnsi", () => {
  it("returns input unchanged when no ANSI codes present", () => {
    expect(stripAnsi("No ANSI codes")).toBe("No ANSI codes");
  });

  it("removes ANSI escape codes", () => {
    expect(stripAnsi("\u001b[31mError\u001b[0m")).toBe("Error");
  });
});

describe("formatDuration", () => {
  it("returns empty string for null duration", () => {
    expect(formatDuration(null)).toBe("");
  });

  it("formats milliseconds under a second", () => {
    expect(formatDuration(200)).toBe("200 ms");
  });

  it("formats milliseconds as seconds with one decimal", () => {
    expect(formatDuration(1500)).toBe("1.5 s");
  });

  it("formats milliseconds over a minute as seconds", () => {
    expect(formatDuration(65500)).toBe("65.5 s");
  });
});
