/**
 * Adds the loose-mode indicator to step labels when required.
 *
 * @param {string} label - base label for the step
 * @param {boolean} supportsLoose - whether this step supports loose mode
 * @param {boolean} isLooseMode - whether the overall run is in loose mode
 *
 * @returns {string} - label optionally decorated with an asterisk
 */
export declare const decorateLabel: (label: string, supportsLoose: boolean, isLooseMode: boolean) => string;
/**
 * Picks the correct command to execute, preferring the loose command when requested.
 *
 * @param {string} baseCommand - command configured for the step
 * @param {string | undefined} looseCommand - loose-mode variant of the command
 * @param {boolean} isLooseMode - whether the current run is in loose mode
 *
 * @returns {string} - command to execute for the step
 */
export declare const selectCommand: (baseCommand: string, looseCommand: string | undefined, isLooseMode: boolean) => string;
/**
 * Executes the provided command via spawnSync after basic validation.
 *
 * @param {string} command - command string to execute
 *
 * @returns {ReturnType<typeof spawnSync>} - child process result
 *
 * @throws when the command is empty
 */
export declare const runCommand: (command: string) => import("child_process").SpawnSyncReturns<string>;
/**
 * Ensures npm run commands are executed with --silent to reduce noise.
 *
 * @param {string} command - input command string
 *
 * @returns {string} - command, adding --silent for npm run invocations
 */
export declare const addSilentFlag: (command: string) => string;
/**
 * Removes ANSI escape codes from a string.
 *
 * @param {string} value - input string
 *
 * @returns {string} - string without ANSI escape codes
 */
export declare const stripAnsi: (value: string) => string;
/**
 * Formats a duration in milliseconds into a human-readable string.
 *
 * @param {number | null} durationMs - duration in milliseconds
 *
 * @returns {string} - formatted duration string
 */
export declare const formatDuration: (durationMs: number | null) => string;
