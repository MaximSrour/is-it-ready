import { describe, expect, it } from "vitest";

import { type RunOptions } from "~/runOptions/types";
import { type TaskConfig } from "~/task/types";

import {
  addSilentFlag,
  decorateLabel,
  formatDuration,
  runCommand,
  selectCommand,
  stripAnsi,
} from "./helpers";

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
  it("throws when command is empty", async () => {
    await expect(runCommand("  ")).rejects.toThrow(/No command configured/);
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
