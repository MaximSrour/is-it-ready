import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { noOp, noOpNever } from "../helpers";
import { getRunOptions, printHelp, printVersion } from "./runOptions";

describe("getRunOptions", () => {
  const originalArgv = process.argv.slice();
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, "exit").mockImplementation(noOpNever);
  });

  afterEach(() => {
    process.argv = [...originalArgv];
    vi.restoreAllMocks();
  });

  it("returns false flags when options omitted", () => {
    process.argv = ["node", "script.js"];
    expect(getRunOptions()).toEqual({
      isSilentMode: false,
      isFixMode: false,
      configPath: undefined,
    });
  });

  it("enables silent mode when --silent passed", () => {
    process.argv = ["node", "script.js", "--silent"];
    expect(getRunOptions()).toEqual({
      isSilentMode: true,
      isFixMode: false,
      configPath: undefined,
    });
  });

  it("enables both flags when both arguments supplied", () => {
    process.argv = ["node", "script.js", "--silent", "--fix"];
    expect(getRunOptions()).toEqual({
      isSilentMode: true,
      isFixMode: true,
      configPath: undefined,
    });
  });

  it("captures a config path when provided with --config", () => {
    process.argv = ["node", "script.js", "--config", "custom.config.js"];

    expect(getRunOptions()).toEqual({
      isSilentMode: false,
      isFixMode: false,
      configPath: "custom.config.js",
    });
  });

  it("captures a config path when provided inline with --config=", () => {
    process.argv = ["node", "script.js", "--config=custom.mjs"];

    expect(getRunOptions()).toEqual({
      isSilentMode: false,
      isFixMode: false,
      configPath: "custom.mjs",
    });
  });

  it("throws when --config is provided without a value", () => {
    process.argv = ["node", "script.js", "--config"];

    expect(() => {
      getRunOptions();
    }).toThrowError(/missing value for --config/i);
  });

  it("throws when --config= is provided without a value", () => {
    process.argv = ["node", "script.js", "--config="];

    expect(() => {
      getRunOptions();
    }).toThrowError(/missing value for --config/i);
  });

  it("throws when multiple configs are provided", () => {
    process.argv = [
      "node",
      "script.js",
      "--config",
      "one.js",
      "--config",
      "two.js",
    ];

    expect(() => {
      getRunOptions();
    }).toThrowError(/multiple configs provided/i);
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
  it("prints version information per GNU standards", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8")
    ) as { version: string; name: string; author: string; license: string };

    const logSpy = vi.spyOn(console, "log").mockImplementation(noOp);

    printVersion();

    expect(logSpy).toHaveBeenCalledWith(`${pkg.name} ${pkg.version}`);
    expect(logSpy).toHaveBeenCalledWith(
      `Copyright (C) ${new Date().getFullYear()} ${pkg.author}`
    );
    expect(logSpy).toHaveBeenCalledWith(`License: ${pkg.license}`);

    logSpy.mockRestore();
  });
});
