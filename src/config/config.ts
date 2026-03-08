import os from "node:os";
import path from "node:path";

import { cosmiconfig } from "cosmiconfig";
import isInstalledGlobally from "is-installed-globally";

import { type RunOptions } from "../runOptions/types";
import { Task, defaultTools } from "../task";
import { type TaskConfig } from "../task/types";

import { type Config, type UserFileConfig, type UserTaskConfig } from "./types";

const DEFAULT_TASKS = new Map<string, (typeof defaultTools)[number]>();
for (const config of defaultTools) {
  DEFAULT_TASKS.set(config.tool, config);
}

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
 * Returns no parsed failure details for unsupported tools.
 *
 * @returns {undefined} Always undefined so exit code drives task success/failure.
 */
function parseUnsupportedFailure() {
  return undefined;
}

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
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(`Config file not found at ${resolvedPath}`);
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
 * Checks if a value is an optional array (array of strings or undefined).
 *
 * @param {unknown} value - The value to check.
 * @returns {boolean} True if the value is an optional array, false otherwise.
 */
const isOptionalArray = (value: unknown): value is string[] | undefined => {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every((item) => {
        return isNonEmptyString(item);
      }))
  );
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
    isOptionalArray(value.watchIgnore) &&
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
    return {
      label: userTask.tool,
      tool: userTask.tool,
      command: userTask.command,
      fixCommand: userTask.fixCommand,
      parseFailure: parseUnsupportedFailure,
      usesExitCodeOnly: true,
    };
  }

  return {
    label: baseConfig.label,
    tool: baseConfig.tool,
    command: userTask.command,
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
): Promise<Config | null> => {
  const exportedConfig = await getConfig(process.cwd(), runOptions.configPath);

  if (!exportedConfig) {
    return null;
  }

  if (!isUserFileConfig(exportedConfig)) {
    throw new Error(
      "Invalid is-it-ready config: expected { tasks: [{ tool, command }] }"
    );
  }

  const watchIgnore = exportedConfig.watchIgnore;
  const unsupportedTools = Array.from(
    new Set(
      exportedConfig.tasks.flatMap((taskDefinition) => {
        return DEFAULT_TASKS.has(taskDefinition.tool)
          ? []
          : [taskDefinition.tool];
      })
    )
  );

  const tasks = exportedConfig.tasks.map((taskDefinition) => {
    const mergedConfig = mergeTaskConfig(taskDefinition);
    return new Task(mergedConfig, runOptions);
  });

  return { watchIgnore, tasks, unsupportedTools };
};
