import { spawn } from "child_process";

import { type RunOptions } from "@/runOptions/types";

/**
 * Adds the loose-mode indicator to step labels when required.
 *
 * @param {string} label - base label for the step
 * @param {boolean} supportsLoose - whether this step supports loose mode
 * @param {boolean} isLooseMode - whether the overall run is in loose mode
 *
 * @returns {string} - label optionally decorated with an asterisk
 */
export const decorateLabel = (
  label: string,
  supportsLoose: boolean,
  isLooseMode: boolean
) => {
  if (isLooseMode && supportsLoose) {
    return `${label}*`;
  }

  return label;
};

/**
 * Picks the correct command to execute, preferring the loose command when requested.
 *
 * @param {string} baseCommand - command configured for the step
 * @param {string | undefined} looseCommand - loose-mode variant of the command
 * @param {boolean} isLooseMode - whether the current run is in loose mode
 *
 * @returns {string} - command to execute for the step
 */
export const selectCommand = (
  baseCommand: string,
  looseCommand: string | undefined,
  fixCommand: string | undefined,
  runOptions: RunOptions
) => {
  if (runOptions.isFixMode && fixCommand) {
    return fixCommand;
  }

  if (runOptions.isLooseMode && looseCommand) {
    return looseCommand;
  }

  return baseCommand;
};

/**
 * Executes the provided command asynchronously after validating it.
 *
 * @param {string} command - command string to execute
 *
 * @returns {Promise<CommandResult>} - child process result
 *
 * @throws when the command is empty
 */
type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

export const runCommand = async (command: string): Promise<CommandResult> => {
  const trimmed = command.trim();
  if (!trimmed) {
    throw new Error("No command configured for this step");
  }

  const finalCommand = addSilentFlag(trimmed);
  return new Promise((resolve, reject) => {
    const child = spawn(finalCommand, {
      env: {
        ...process.env,
        FORCE_COLOR: process.env.FORCE_COLOR ?? "1",
        npm_config_color: process.env.npm_config_color ?? "always",
      },
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf-8");
    child.stderr.setEncoding("utf-8");

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (status) => {
      resolve({ status, stdout, stderr });
    });
  });
};

/**
 * Ensures npm run commands are executed with --silent to reduce noise.
 *
 * @param {string} command - input command string
 *
 * @returns {string} - command, adding --silent for npm run invocations
 */
export const addSilentFlag = (command: string) => {
  if (!/^npm\b/.test(command.trim())) {
    return command;
  }

  if (command.includes("--silent")) {
    return command;
  }

  return command.replace(/npm\s+run\b/, "npm run --silent");
};

/**
 * Removes ANSI escape codes from a string.
 *
 * @param {string} value - input string
 *
 * @returns {string} - string without ANSI escape codes
 */
export const stripAnsi = (value: string) => {
  return value.replace(/\u001b\[.*?m/g, "");
};

/**
 * Formats a duration in milliseconds into a human-readable string.
 *
 * @param {number | null} durationMs - duration in milliseconds
 *
 * @returns {string} - formatted duration string
 */
export const formatDuration = (durationMs: number | null) => {
  if (durationMs === null) {
    return "";
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(1)} s`;
};
