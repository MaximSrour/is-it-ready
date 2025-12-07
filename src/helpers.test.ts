import { afterEach, describe, expect, it } from "vitest";

import {
  addSilentFlag,
  decorateLabel,
  formatDuration,
  getRunOptions,
  runCommand,
  selectCommand,
  stripAnsi,
} from "./helpers";

describe("getRunOptions", () => {
  const originalArgv = process.argv.slice();

  afterEach(() => {
    process.argv = [...originalArgv];
  });

  it("returns false flags when options omitted", () => {
    process.argv = ["node", "script.js"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: false,
    });
  });

  it("enables loose mode when --loose passed", () => {
    process.argv = ["node", "script.js", "--loose"];
    expect(getRunOptions()).toEqual({
      isLooseMode: true,
      isSilentMode: false,
    });
  });

  it("enables silent mode when --silent passed", () => {
    process.argv = ["node", "script.js", "--silent"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: true,
    });
  });

  it("enables both flags when both arguments supplied", () => {
    process.argv = ["node", "script.js", "--silent", "--loose"];
    expect(getRunOptions()).toEqual({
      isLooseMode: true,
      isSilentMode: true,
    });
  });
});

describe("decorateLabel", () => {
  it("returns label unchanged when loose mode disabled", () => {
    expect(decorateLabel("Linting", true, false)).toBe("Linting");
  });

  it("appends asterisk when loose mode active and supported", () => {
    expect(decorateLabel("Linting", true, true)).toBe("Linting*");
  });

  it("ignores loose mode when step does not support it", () => {
    expect(decorateLabel("Tests", false, true)).toBe("Tests");
  });
});

describe("selectCommand", () => {
  it("returns base command when loose mode disabled", () => {
    expect(selectCommand("npm run lint", "npm run lint:loose", false)).toBe(
      "npm run lint"
    );
  });

  it("returns loose command when loose mode enabled", () => {
    expect(selectCommand("npm run lint", "npm run lint:loose", true)).toBe(
      "npm run lint:loose"
    );
  });

  it("returns base command when no loose command provided", () => {
    expect(selectCommand("npm run lint", undefined, true)).toBe("npm run lint");
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
