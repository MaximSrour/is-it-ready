import { describe, expect, it } from "vitest";

import {
  addSilentFlag,
  decorateLabel,
  formatDuration,
  runCommand,
  selectCommand,
  stripAnsi,
} from "./helpers";
import { type RunOptions } from "./runOptions/types";

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
  const base = "npm run lint";
  const loose = "npm run lint:loose";
  const fix = "npm run lint:fix";

  const makeOptions = (isLoose: boolean, fix: boolean): RunOptions => {
    return {
      isLooseMode: isLoose,
      isFixMode: fix,
      isSilentMode: false,
    };
  };

  it("returns fix command when fix mode enabled", () => {
    expect(selectCommand(base, loose, fix, makeOptions(false, true))).toBe(fix);
  });

  it("falls back to base when fix mode enabled but no fix command", () => {
    expect(
      selectCommand(base, loose, undefined, makeOptions(false, true))
    ).toBe(base);
  });

  it("prioritizes fix over loose", () => {
    expect(selectCommand(base, loose, fix, makeOptions(true, true))).toBe(fix);
  });

  it("returns loose command when loose mode enabled", () => {
    expect(selectCommand(base, loose, fix, makeOptions(true, false))).toBe(
      loose
    );
  });

  it("falls back to base when loose mode enabled but no loose command", () => {
    expect(selectCommand(base, undefined, fix, makeOptions(true, false))).toBe(
      base
    );
  });

  it("returns base command when no flags enabled", () => {
    expect(selectCommand(base, loose, fix, makeOptions(false, false))).toBe(
      base
    );
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
