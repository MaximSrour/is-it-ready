import fs from "fs";
import path from "path";

import pkg from "../../package.json";
import { type RunOptions } from "./types";

/**
 * Parses command-line arguments to determine run options.
 * Processes arguments one by one, exiting immediately if --help or --version is encountered.
 *
 * @returns {RunOptions} - object indicating active modes
 */
export const getRunOptions = (): RunOptions => {
  const args = process.argv.slice(2);

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--version" || arg === "-v") {
      printVersion();
      process.exit(0);
    }
  }

  const isLooseMode = args.includes("--loose");
  const isSilentMode = args.includes("--silent");

  return { isLooseMode, isSilentMode };
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
