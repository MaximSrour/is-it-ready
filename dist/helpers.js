"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDuration = exports.stripAnsi = exports.addSilentFlag = exports.runCommand = exports.selectCommand = exports.decorateLabel = void 0;
const child_process_1 = require("child_process");
/**
 * Adds the loose-mode indicator to step labels when required.
 *
 * @param {string} label - base label for the step
 * @param {boolean} supportsLoose - whether this step supports loose mode
 * @param {boolean} isLooseMode - whether the overall run is in loose mode
 *
 * @returns {string} - label optionally decorated with an asterisk
 */
const decorateLabel = (label, supportsLoose, isLooseMode) => {
    if (isLooseMode && supportsLoose) {
        return `${label}*`;
    }
    return label;
};
exports.decorateLabel = decorateLabel;
/**
 * Picks the correct command to execute, adding the :loose suffix if needed.
 *
 * @param {string} baseCommand - command configured for the step
 * @param {boolean} supportsLoose - whether the step supports loose mode
 * @param {boolean} isLooseMode - whether the current run is in loose mode
 *
 * @returns {string} - command to execute for the step
 */
const selectCommand = (baseCommand, supportsLoose, isLooseMode) => {
    if (isLooseMode && supportsLoose) {
        return appendLooseSuffix(baseCommand);
    }
    return baseCommand;
};
exports.selectCommand = selectCommand;
/**
 * Appends the :loose suffix to the appropriate part of the command.
 *
 * @param {string} command - original command string
 *
 * @returns {string} - command with :loose suffix added
 */
const appendLooseSuffix = (command) => {
    const npmRunMatch = command.match(/^(npm\s+run\s+)(\S+)(.*)$/);
    if (npmRunMatch) {
        const [, prefix, script, suffix] = npmRunMatch;
        if (script.endsWith(":loose")) {
            return command;
        }
        return `${prefix}${script}:loose${suffix}`;
    }
    const parts = command.trim().split(/\s+/);
    if (parts.length === 0) {
        return command;
    }
    const lastIndex = parts.length - 1;
    if (parts[lastIndex].endsWith(":loose")) {
        return command;
    }
    parts[lastIndex] = `${parts[lastIndex]}:loose`;
    return parts.join(" ");
};
/**
 * Executes the provided command via spawnSync after basic validation.
 *
 * @param {string} command - command string to execute
 *
 * @returns {ReturnType<typeof spawnSync>} - child process result
 *
 * @throws when the command is empty
 */
const runCommand = (command) => {
    const trimmed = command.trim();
    if (!trimmed) {
        throw new Error("No command configured for this step");
    }
    const finalCommand = (0, exports.addSilentFlag)(trimmed);
    return (0, child_process_1.spawnSync)(finalCommand, {
        encoding: "utf-8",
        env: {
            ...process.env,
            FORCE_COLOR: process.env.FORCE_COLOR ?? "1",
            npm_config_color: process.env.npm_config_color ?? "always",
        },
        shell: true,
    });
};
exports.runCommand = runCommand;
/**
 * Ensures npm run commands are executed with --silent to reduce noise.
 *
 * @param {string} command - input command string
 *
 * @returns {string} - command, adding --silent for npm run invocations
 */
const addSilentFlag = (command) => {
    if (!/^npm\b/.test(command.trim())) {
        return command;
    }
    if (command.includes("--silent")) {
        return command;
    }
    return command.replace(/npm\s+run\b/, "npm run --silent");
};
exports.addSilentFlag = addSilentFlag;
/**
 * Removes ANSI escape codes from a string.
 *
 * @param {string} value - input string
 *
 * @returns {string} - string without ANSI escape codes
 */
const stripAnsi = (value) => {
    return value.replace(/\u001b\[.*?m/g, "");
};
exports.stripAnsi = stripAnsi;
/**
 * Formats a duration in milliseconds into a human-readable string.
 *
 * @param {number | null} durationMs - duration in milliseconds
 *
 * @returns {string} - formatted duration string
 */
const formatDuration = (durationMs) => {
    if (durationMs === null) {
        return "";
    }
    if (durationMs < 1000) {
        return `${durationMs} ms`;
    }
    return `${(durationMs / 1000).toFixed(1)} s`;
};
exports.formatDuration = formatDuration;
