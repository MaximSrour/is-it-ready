import os from "node:os";
import path from "node:path";

import { cosmiconfig } from "cosmiconfig";
import isInstalledGlobally from "is-installed-globally";

import { type RunOptions } from "@/runOptions/types";

import { Task, taskConfig } from "../task";
import { type TaskConfig } from "../task/types";
import { type UserFileConfig, type UserTaskConfig } from "./types";

const DEFAULT_TASKS = new Map(
  taskConfig.map((config) => {
    return [config.tool, config];
  })
);

const SEARCH_PLACES = [
  ".is-it-ready.config.js",
  ".is-it-ready.config.mjs",
  ".is-it-ready.config.cjs",
  "package.json",
];

const explorer = cosmiconfig("is-it-ready", {
  searchPlaces: SEARCH_PLACES,
  ...(isInstalledGlobally ? { stopDir: os.homedir() } : {}),
});

/**
 * Get the user configuration for the project.
 *
 * @param {string} rootDirectory - The root directory of the project.
 * @param {string} [configPath] - Optional path to a specific configuration file.
 * @returns {Promise<unknown | null>} The user configuration or null if not found.
 */
const getConfig = async (rootDirectory: string, configPath?: string) => {
  if (configPath) {
    const resolvedPath = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(rootDirectory, configPath);

    try {
      const result = await explorer.load(resolvedPath);
      const config: unknown = result?.config ?? null;

      return config;
    } catch (error) {
      const maybeNodeError = error as NodeJS.ErrnoException;

      if (maybeNodeError.code === "ENOENT") {
        const isNodeErrorWithCode = (err: unknown): err is { code: string } => {
          return (
            typeof err === "object" &&
            err !== null &&
            "code" in err &&
            typeof (err as { code: unknown }).code === "string"
          );
        };

        if (isNodeErrorWithCode(error) && error.code === "ENOENT") {
          throw new Error(`Config file not found at ${resolvedPath}`);
        }
      }

      throw error;
    }
  }

  const result = await explorer.search(rootDirectory);
  const config: unknown = result?.config ?? null;

  return config;
};

/**
 * Checks if a value is a record (object with string keys).
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a record, false otherwise.
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Checks if a value is a non-empty string.
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a non-empty string, false otherwise.
 */
const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

/**
 * Checks if a value is an optional string (string or undefined).
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is an optional string, false otherwise.
 */
const isOptionalString = (value: unknown): value is string | undefined => {
  return value === undefined || isNonEmptyString(value);
};

/**
 * Checks if a value is a user task configuration.
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a user task configuration, false otherwise.
 */
const isUserTaskConfig = (value: unknown): value is UserTaskConfig => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.tool) &&
    isNonEmptyString(value.command) &&
    isOptionalString(value.looseCommand) &&
    isOptionalString(value.fixCommand)
  );
};

/**
 * Checks if a value is a user file configuration.
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is a user file configuration, false otherwise.
 */
const isUserFileConfig = (value: unknown): value is UserFileConfig => {
  return (
    isRecord(value) &&
    Array.isArray(value.tasks) &&
    value.tasks.every((task) => {
      return isUserTaskConfig(task);
    })
  );
};

/**
 * Merges a user task configuration with the default task configuration.
 *
 * @param {UserTaskConfig} userTask - The user task configuration.
 * @returns {TaskConfig} The merged task configuration.
 * @throws {Error} If the tool is unknown.
 */
const mergeTaskConfig = (userTask: UserTaskConfig): TaskConfig => {
  const baseConfig = DEFAULT_TASKS.get(userTask.tool);

  if (!baseConfig) {
    throw new Error(
      `Unknown tool "${userTask.tool}" found in .is-it-ready.config`
    );
  }

  return {
    label: baseConfig.label,
    tool: baseConfig.tool,
    command: userTask.command,
    looseCommand: userTask.looseCommand,
    fixCommand: userTask.fixCommand,
    parseFailure: baseConfig.parseFailure,
  };
};

/**
 * Loads the user configuration for the project.
 *
 * @param {RunOptions} runOptions - The run options for the tasks.
 * @returns {Promise<Task[] | null>} The loaded user tasks or null if not found.
 */
export const loadUserConfig = async (
  runOptions: RunOptions
): Promise<Task[] | null> => {
  const exportedConfig = await getConfig(process.cwd(), runOptions.configPath);

  if (!exportedConfig) {
    return null;
  }

  if (!isUserFileConfig(exportedConfig)) {
    throw new Error(
      "Invalid is-it-ready config: expected { tasks: [{ tool, command }] }"
    );
  }

  const tasks = exportedConfig.tasks.map((taskDefinition) => {
    const mergedConfig = mergeTaskConfig(taskDefinition);
    return new Task(mergedConfig, runOptions);
  });

  return tasks;
};
