import { spawn } from "child_process";

import { type TaskConfig } from "@/config/types";
import { type RunOptions } from "@/runOptions/types";

import { type CommandResult, type ExecutableCommand } from "./types";

/**
 * Adds an indicator to a label.
 *
 * @param {string} label - Original label.
 * @returns {string} - Label decorated with an asterisk.
 */
export const decorateLabel = (label: string) => {
  return `${label}*`;
};

/**
 * Picks the correct command to execute from the provided task config.
 *
 * @param {TaskConfig} toolConfig - Configuration for the task.
 * @param {RunOptions} runOptions - The current run options.
 * @returns {ExecutableCommand} - Command to execute for the task.
 */
export const selectCommand = (
  toolConfig: TaskConfig,
  runOptions: RunOptions
): ExecutableCommand => {
  if (runOptions.isFixMode) {
    if (toolConfig.fixCommand) {
      return {
        label: decorateLabel(toolConfig.label),
        command: toolConfig.fixCommand,
      };
    }
  } else if (runOptions.isLooseMode) {
    if (toolConfig.looseCommand) {
      return {
        label: decorateLabel(toolConfig.label),
        command: toolConfig.looseCommand,
      };
    }
  }

  return { label: toolConfig.label, command: toolConfig.command };
};

/**
 * Executes the provided command asynchronously after validating it.
 *
 * @param {string} command - Command string to execute.
 * @returns {Promise<CommandResult>} - Child process result.
 * @throws When the command is empty.
 */
export const runCommand = async (command: string): Promise<CommandResult> => {
  const trimmed = command.trim();
  if (!trimmed) {
    throw new Error("No command configured for this task");
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
 * @param {string} command - Input command string.
 * @returns {string} - Command, adding --silent for npm run invocations.
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
 * @param {string} value - Input string.
 * @returns {string} - String without ANSI escape codes.
 */
export const stripAnsi = (value: string) => {
  return value.replace(/\u001b\[.*?m/g, "");
};

/**
 * Formats a duration in milliseconds into a human-readable string.
 *
 * @param {number | null} durationMs - Duration in milliseconds.
 * @returns {string} - Formatted duration string.
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
