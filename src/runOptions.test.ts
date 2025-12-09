import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { noOp } from "./noOp";
import { getRunOptions, printHelp, printVersion } from "./runOptions";

describe("getRunOptions", () => {
  const originalArgv = process.argv.slice();
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock process.exit to prevent tests from actually exiting
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      return undefined as never;
    });
  });

  afterEach(() => {
    process.argv = [...originalArgv];
    vi.restoreAllMocks();
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

  it("exits immediately when --help is supplied", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(noOp);

    process.argv = ["node", "script.js", "--help"];
    getRunOptions();

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("exits immediately when -h is supplied", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(noOp);

    process.argv = ["node", "script.js", "-h"];
    getRunOptions();

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("exits immediately when --version is supplied", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);

    process.argv = ["node", "script.js", "--version"];
    getRunOptions();

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalled();
  });

  it("exits immediately when -v is supplied", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);

    process.argv = ["node", "script.js", "-v"];
    getRunOptions();

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalled();
  });

  it("exits with help when both --help and --version are supplied (help comes first)", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(noOp);

    process.argv = ["node", "script.js", "--help", "--version"];
    getRunOptions();

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("exits with version when both --version and --help are supplied (version comes first)", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);

    process.argv = ["node", "script.js", "--version", "--help"];
    getRunOptions();

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalled();
  });
});

describe("printHelp", () => {
  it("prints the help markdown content", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(noOp);

    printHelp();

    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy.mock.calls[0][0]).toContain("is-it-ready help");
    expect(logSpy.mock.calls[0][0]).toContain("Usage");
    expect(logSpy.mock.calls[0][0]).toContain("--help");
    expect(logSpy.mock.calls[0][0]).toContain("--version");
    expect(errorSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

describe("printVersion", () => {
  it("prints version information per GNU standards", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf-8")
    ) as { version: string; name: string; author: string; license: string };

    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);

    printVersion();

    expect(logSpy).toHaveBeenCalledWith(`${pkg.name} ${pkg.version}`);
    expect(logSpy).toHaveBeenCalledWith(`Copyright (C) 2024 ${pkg.author}`);
    expect(logSpy).toHaveBeenCalledWith(`License: ${pkg.license}`);

    logSpy.mockRestore();
  });
});
