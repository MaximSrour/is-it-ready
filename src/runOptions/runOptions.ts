import fs from "fs";
import path from "path";

import pkg from "../../package.json";
import { type RunOptions } from "./types";

/**
 * Parses command-line arguments to determine run options.
 * Processes arguments one by one, exiting immediately if --help or --version is encountered.
 *
 * @returns {RunOptions} - Object indicating active modes.
 * @throws {Error} - If required values for options are missing.
 */
export const getRunOptions = (): RunOptions => {
  const args = process.argv.slice(2);

  let isSilentMode = false;
  let isFixMode = false;
  let isWatchMode = false;
  let configPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg === "--version" || arg === "-v") {
      printVersion();
      process.exit(0);
    } else if (arg === "--config") {
      const value = args[index + 1];

      if (!value || value.startsWith("-")) {
        throw new Error("Missing value for --config");
      }

      if (configPath) {
        throw new Error("Multiple configs provided");
      }

      configPath = value;
      index += 1;
      continue;
    } else if (arg.startsWith("--config=")) {
      const value = arg.split("=", 2)[1];

      if (!value) {
        throw new Error("Missing value for --config");
      }

      configPath = value;
      continue;
    } else if (arg === "--silent") {
      isSilentMode = true;
    } else if (arg === "--fix") {
      isFixMode = true;
    } else if (arg === "--watch") {
      isWatchMode = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return { isSilentMode, isFixMode, isWatchMode, configPath };
};

export const printHelp = () => {
  const helpPath = path.resolve(__dirname, "help.md");

  try {
    const content = fs.readFileSync(helpPath, "utf-8");
    console.log(content.trimEnd());
  } catch (error) {
    console.error(`Error reading help file: ${(error as Error).message}`);
  }
};

export const printVersion = () => {
  console.log(`${pkg.name} ${pkg.version}`);
  console.log(`Copyright (C) ${new Date().getFullYear()} ${pkg.author}`);
  console.log(`License: ${pkg.license}`);
  console.log();
  console.log(
    "This is free software: you are free to change and redistribute it."
  );
  console.log("There is NO WARRANTY, to the extent permitted by law.");
};
