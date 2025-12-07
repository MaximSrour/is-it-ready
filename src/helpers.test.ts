import { describe, expect, it } from "vitest";
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
  it("returns base command when loose mode disabled", () => {
    expect(selectCommand("npm run lint", true, false)).toBe("npm run lint");
  });

  it("appends :loose to npm run scripts", () => {
    const command = "npm run lint -- --cache";
    expect(selectCommand(command, true, true)).toBe(
      "npm run lint:loose -- --cache"
    );
  });

  it("leaves npm command untouched if already loose", () => {
    const command = "npm run lint:loose -- --cache";
    expect(selectCommand(command, true, true)).toBe(command);
  });

  it("appends :loose to the final token for non-npm commands", () => {
    expect(selectCommand("pnpm lint", true, true)).toBe("pnpm lint:loose");
  });

  it("returns base command when loose mode unsupported", () => {
    expect(selectCommand("npm run lint", false, true)).toBe("npm run lint");
  });
});

describe("runCommand", () => {
  it("throws when command is empty", () => {
    expect(() => runCommand("  ")).toThrow(/No command configured/);
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
