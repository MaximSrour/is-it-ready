import { describe, expect, it } from "vitest";

import { type RunOptions } from "@/runOptions/types";

import {
  addSilentFlag,
  decorateLabel,
  formatDuration,
  runCommand,
  selectCommand,
  stripAnsi,
} from "./helpers";

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
  const baseCommand = "npm run lint";
  const looseCommand = "npm run lint:loose";
  const fixCommand = "npm run lint:fix";

  const makeOptions = (isLoose: boolean, isFix: boolean): RunOptions => {
    return {
      isLooseMode: isLoose,
      isFixMode: isFix,
      isSilentMode: false,
    };
  };

  it("returns fix command when fix mode enabled", () => {
    expect(
      selectCommand(
        baseCommand,
        looseCommand,
        fixCommand,
        makeOptions(false, true)
      )
    ).toBe(fixCommand);
  });

  it("falls back to base when fix mode enabled but no fix command", () => {
    expect(
      selectCommand(
        baseCommand,
        looseCommand,
        undefined,
        makeOptions(false, true)
      )
    ).toBe(baseCommand);
  });

  it("prioritizes fix over loose", () => {
    expect(
      selectCommand(
        baseCommand,
        looseCommand,
        fixCommand,
        makeOptions(true, true)
      )
    ).toBe(fixCommand);
  });

  it("returns loose command when loose mode enabled", () => {
    expect(
      selectCommand(
        baseCommand,
        looseCommand,
        fixCommand,
        makeOptions(true, false)
      )
    ).toBe(looseCommand);
  });

  it("falls back to base when loose mode enabled but no loose command", () => {
    expect(
      selectCommand(
        baseCommand,
        undefined,
        fixCommand,
        makeOptions(true, false)
      )
    ).toBe(baseCommand);
  });

  it("returns base command when no flags enabled", () => {
    expect(
      selectCommand(
        baseCommand,
        looseCommand,
        fixCommand,
        makeOptions(false, false)
      )
    ).toBe(baseCommand);
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
