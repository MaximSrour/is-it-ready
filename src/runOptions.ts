import fs from "fs";
import path from "path";

import pkg from "../package.json";
import { type RunOptions } from "./types";

/**
 * Parses command-line arguments to determine run options.
 *
 * @returns {RunOptions} - object indicating active modes
 */
export const getRunOptions = (): RunOptions => {
  const isLooseMode = process.argv.includes("--loose");
  const isSilentMode = process.argv.includes("--silent");
  const showHelp =
    process.argv.includes("--help") || process.argv.includes("-h");
  const showVersion =
    process.argv.includes("--version") || process.argv.includes("-v");

  const runOptions = { isLooseMode, isSilentMode, showHelp, showVersion };

  return runOptions;
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
  console.log(`v${pkg.version}`);
};
