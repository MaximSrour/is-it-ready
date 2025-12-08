import fs from "fs";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { noOp } from "./noOp";
import { getRunOptions, printHelp, printVersion } from "./runOptions";

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
      showVersion: false,
    });
  });

  it("enables loose mode when --loose passed", () => {
    process.argv = ["node", "script.js", "--loose"];
    expect(getRunOptions()).toEqual({
      isLooseMode: true,
      isSilentMode: false,
      showHelp: false,
      showVersion: false,
    });
  });

  it("enables silent mode when --silent passed", () => {
    process.argv = ["node", "script.js", "--silent"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: true,
      showHelp: false,
      showVersion: false,
    });
  });

  it("enables both flags when both arguments supplied", () => {
    process.argv = ["node", "script.js", "--silent", "--loose"];
    expect(getRunOptions()).toEqual({
      isLooseMode: true,
      isSilentMode: true,
      showHelp: false,
      showVersion: false,
    });
  });

  it("shows help when either help flag is supplied", () => {
    process.argv = ["node", "script.js", "--help"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: false,
      showHelp: true,
      showVersion: false,
    });

    process.argv = ["node", "script.js", "-h"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: false,
      showHelp: true,
      showVersion: false,
    });
  });

  it("shows version when either version flag is supplied", () => {
    process.argv = ["node", "script.js", "--version"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: false,
      showHelp: false,
      showVersion: true,
    });

    process.argv = ["node", "script.js", "-v"];
    expect(getRunOptions()).toEqual({
      isLooseMode: false,
      isSilentMode: false,
      showHelp: false,
      showVersion: true,
    });
  });
});

describe("printHelp", () => {
  it("prints the help markdown content", () => {
    const helpPath = path.resolve(__dirname, "help.md");
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

describe("printVersion", () => {
  it("prints the version number from package.json", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
    ) as { version: string };

    const expected = `v${pkg.version}`;
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);

    printVersion();

    expect(logSpy).toHaveBeenCalledWith(expected);

    logSpy.mockRestore();
  });
});
