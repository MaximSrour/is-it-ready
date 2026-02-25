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

  type MockStream = EventEmitter & {
    setEncoding: ReturnType<typeof vi.fn>;
  };

  type MockChild = ChildProcess & {
    stdout: MockStream;
    stderr: MockStream;
    stdoutSetEncodingMock: ReturnType<typeof vi.fn>;
    stderrSetEncodingMock: ReturnType<typeof vi.fn>;
  };

  const restoreEnv = (originalEnv: NodeJS.ProcessEnv) => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    Object.assign(process.env, originalEnv);
  };

  const createMockChild = (): MockChild => {
    const stdoutSetEncodingMock = vi.fn();
    const stderrSetEncodingMock = vi.fn();
    const stdout = new EventEmitter() as MockStream;
    const stderr = new EventEmitter() as MockStream;
    stdout.setEncoding = stdoutSetEncodingMock;
    stderr.setEncoding = stderrSetEncodingMock;

    return Object.assign(new EventEmitter(), {
      stdout,
      stderr,
      stdoutSetEncodingMock,
      stderrSetEncodingMock,
    }) as MockChild;
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

  it("collects stdout and stderr chunks and resolves close status", async () => {
    const child = createMockChild();
    spawnMock.mockReturnValue(child);

    const promise = runCommand("echo test");

    expect(spawnMock).toHaveBeenCalledWith(
      "echo test",
      expect.objectContaining({ shell: true })
    );
    expect(child.stdoutSetEncodingMock).toHaveBeenCalledWith("utf-8");
    expect(child.stderrSetEncodingMock).toHaveBeenCalledWith("utf-8");

    child.stdout.emit("data", "out-1");
    child.stdout.emit("data", "out-2");
    child.stderr.emit("data", "err-1");
    child.emit("close", 2);

    await expect(promise).resolves.toEqual({
      status: 2,
      stdout: "out-1out-2",
      stderr: "err-1",
    });
  });

  it("rejects when the spawned process emits an error", async () => {
    const child = createMockChild();
    spawnMock.mockReturnValue(child);

    const promise = runCommand("echo test");
    child.emit("error", new Error("spawn failed"));

    await expect(promise).rejects.toThrow(/spawn failed/i);
  });

  it("copies process environment when run options are omitted", async () => {
    const originalEnv = { ...process.env };
    process.env.HELPERS_MUTATION_TEST = "present";

    const child = createMockChild();
    spawnMock.mockReturnValue(child);

    const promise = runCommand("npm run lint");
    const options = spawnMock.mock.calls[0][1] as SpawnOptions;
    const env = options.env ?? ({} as NodeJS.ProcessEnv);
    child.emit("close", 0);
    await promise;

    expect(env.HELPERS_MUTATION_TEST).toBe("present");

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

  it("adds --silent for npm run commands with leading whitespace", () => {
    expect(addSilentFlag("  npm run lint")).toBe("  npm run --silent lint");
  });

  it("leaves npm commands untouched when they are not npm run", () => {
    expect(addSilentFlag("npm test")).toBe("npm test");
  });

  it("does not rewrite commands that mention npm run later in the string", () => {
    expect(addSilentFlag("echo npm run lint")).toBe("echo npm run lint");
  });

  it("handles npm run with multiple spaces between tokens", () => {
    expect(addSilentFlag("npm    run lint")).toBe("npm run --silent lint");
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

  it("formats exactly one second as seconds", () => {
    expect(formatDuration(1000)).toBe("1.0 s");
  });

  it("formats milliseconds over a minute as seconds", () => {
    expect(formatDuration(65500)).toBe("65.5 s");
  });
});
