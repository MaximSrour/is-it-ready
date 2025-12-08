import fs from "fs";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { noOp } from "./noOp";
import { getRunOptions, printHelp } from "./runOptions";

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
      showHelp: false,
    });
  });

  it("enables loose mode when --loose passed", () => {
    process.argv = ["node", "script.js", "--loose"];
    expect(getRunOptions()).toEqual({
      isLooseMode: true,
      isSilentMode: false,
      showHelp: false,
    });
  });

  it("enables silent mode when --silent passed", () => {
    process.argv = ["node", "script.js", "--silent"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: true,
      showHelp: false,
    });
  });

  it("enables both flags when both arguments supplied", () => {
    process.argv = ["node", "script.js", "--silent", "--loose"];
    expect(getRunOptions()).toEqual({
      isLooseMode: true,
      isSilentMode: true,
      showHelp: false,
    });
  });

  it("shows help when either help flag is supplied", () => {
    process.argv = ["node", "script.js", "--help"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: false,
      showHelp: true,
    });

    process.argv = ["node", "script.js", "-h"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: false,
      showHelp: true,
    });
  });
});

describe("printHelp", () => {
  it("prints the help markdown content", () => {
    const helpPath = path.resolve(__dirname, "..", "help.md");
    const expected = fs.readFileSync(helpPath, "utf-8").trimEnd();
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(noOp);

    printHelp();

    expect(logSpy).toHaveBeenCalledWith(expected);
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
