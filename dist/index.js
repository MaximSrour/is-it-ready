#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const package_json_1 = __importDefault(require("../package.json"));
const config_1 = require("./config");
const helpers_1 = require("./helpers");
const parsers_1 = require("./parsers");
const render_1 = require("./render");
const args = process.argv.slice(2);
const isLooseMode = args.includes("--loose");
const isSilentMode = args.includes("--silent");
const steps = config_1.stepConfig.map((config) => {
    const supportsLoose = Boolean(config.looseCommand);
    return {
        label: (0, helpers_1.decorateLabel)(config.label, supportsLoose, isLooseMode),
        tool: config.tool,
        command: (0, helpers_1.selectCommand)(config.command, config.looseCommand, isLooseMode),
        parseFailure: parsers_1.parserMap[config.tool],
    };
});
const tableHeaders = ["Label", "Tool", "Results", "Time"];
const icons = {
    pending: "  ",
    running: "⏳",
    success: "✅",
    failure: "❌",
};
const statuses = steps.map(() => ({
    state: "pending",
    message: "",
}));
const durations = steps.map(() => null);
const failures = [];
let totalErrors = 0;
let totalWarnings = 0;
let suiteFinished = false;
const suiteStartTime = Date.now();
let suiteDurationMs = null;
void main().catch((error) => {
    console.error(chalk_1.default.red("Unexpected error while running steps."));
    console.error(error);
    process.exit(1);
});
async function main() {
    render();
    await Promise.all(steps.map((step, index) => executeStep(step, index)));
    suiteFinished = true;
    suiteDurationMs = Date.now() - suiteStartTime;
    render();
    printFailureDetails(failures);
    process.exit(failures.length > 0 ? 1 : 0);
}
function updateStatus(index, state, message) {
    statuses[index] = { state, message };
    render();
}
function recordIssueCounts(parsedFailure) {
    if (!parsedFailure) {
        totalErrors += 1;
        return;
    }
    const errors = parsedFailure.errors ?? 0;
    const warnings = parsedFailure.warnings ?? 0;
    if (errors === 0 && warnings === 0) {
        totalErrors += 1;
        return;
    }
    totalErrors += errors;
    totalWarnings += warnings;
}
function render() {
    if (process.stdout.isTTY) {
        console.clear();
    }
    console.log(chalk_1.default.bold(`${package_json_1.default.name} v${package_json_1.default.version}`) +
        " — Validating your code quality");
    console.log();
    if (isLooseMode) {
        console.log("(* indicates loose mode; some rules are disabled or set to warnings)\n");
    }
    const rows = steps.map((step, idx) => {
        const status = statuses[idx];
        const message = status.state === "pending"
            ? ""
            : colorStatusMessage(status.message, status.state);
        return [
            `${icons[status.state]} ${step.label}`,
            step.tool,
            message,
            (0, helpers_1.formatDuration)(durations[idx]),
        ];
    });
    const overallIssues = totalErrors + totalWarnings;
    const overallIcon = suiteFinished
        ? overallIssues === 0
            ? icons.success
            : icons.failure
        : icons.running;
    const overallDurationMs = suiteFinished
        ? (suiteDurationMs ?? 0)
        : Date.now() - suiteStartTime;
    const breakdownParts = [];
    if (totalErrors > 0) {
        breakdownParts.push(`${totalErrors} error${totalErrors === 1 ? "" : "s"}`);
    }
    if (totalWarnings > 0) {
        breakdownParts.push(`${totalWarnings} warning${totalWarnings === 1 ? "" : "s"}`);
    }
    const breakdown = breakdownParts.length > 0 ? ` (${breakdownParts.join(", ")})` : "";
    const overallRow = [
        `${overallIcon} Overall`,
        "",
        `${overallIssues} issue${overallIssues === 1 ? "" : "s"}${breakdown}`,
        (0, helpers_1.formatDuration)(overallDurationMs),
    ];
    console.log((0, render_1.renderTable)(tableHeaders, rows, overallRow));
}
async function executeStep(step, index) {
    updateStatus(index, "running", "Running...");
    const startTime = Date.now();
    try {
        const result = await (0, helpers_1.runCommand)(step.command);
        durations[index] = Date.now() - startTime;
        const rawCombined = [result.stdout, result.stderr]
            .filter(Boolean)
            .join("\n");
        const combined = (0, helpers_1.stripAnsi)(rawCombined);
        const parsedFailure = step.parseFailure?.(combined);
        if (result.status === 0 && !parsedFailure) {
            updateStatus(index, "success", "Passed");
            return;
        }
        const detail = parsedFailure?.message ?? "Failed - see output below for details";
        updateStatus(index, "failure", detail);
        failures.push({
            label: step.label,
            tool: step.tool,
            command: step.command,
            errors: parsedFailure?.errors ?? undefined,
            warnings: parsedFailure?.warnings ?? undefined,
            summary: parsedFailure?.message ?? undefined,
            output: combined.trim(),
            rawOutput: rawCombined.trim() || combined.trim(),
        });
        recordIssueCounts(parsedFailure);
    }
    catch (error) {
        durations[index] = Date.now() - startTime;
        const message = error instanceof Error
            ? error.message
            : typeof error === "string"
                ? error
                : "Failed to execute command";
        updateStatus(index, "failure", message);
        failures.push({
            label: step.label,
            tool: step.tool,
            command: step.command,
            summary: message,
            output: message,
            rawOutput: message,
        });
        recordIssueCounts();
    }
}
/**
 * Prints detailed information about failed steps.
 *
 * @param {FailureDetails[]} failures - Array of failure details to print
 */
function printFailureDetails(failures) {
    if (failures.length > 0) {
        if (isSilentMode) {
            console.log("\nSome checks failed. Run without --silent to see details.");
            return;
        }
        console.log("\nDetails:");
        failures.forEach((failure) => {
            const headline = formatFailureHeadline(failure);
            console.log(`\n${headline}`);
            console.log(failure.rawOutput || failure.output || "(no output)");
        });
    }
}
function colorStatusMessage(message, state) {
    if (!message) {
        return "";
    }
    if (state === "failure") {
        return chalk_1.default.red(message);
    }
    if (state === "success") {
        return chalk_1.default.white(message);
    }
    return message;
}
function formatFailureHeadline(failure) {
    const breakdownParts = [];
    if (typeof failure.errors === "number") {
        breakdownParts.push(chalk_1.default.red(`${failure.errors} error${failure.errors === 1 ? "" : "s"}`));
    }
    if (typeof failure.warnings === "number") {
        breakdownParts.push(`${failure.warnings} warning${failure.warnings === 1 ? "" : "s"}`);
    }
    const detail = breakdownParts.length > 0
        ? breakdownParts.join(", ")
        : (failure.summary ?? "See output");
    const labelText = chalk_1.default.blue.underline(failure.label);
    const commandText = chalk_1.default.yellow(failure.command);
    const detailText = chalk_1.default.red(detail);
    return `${labelText} - ${failure.tool} [${commandText}] (${detailText})`;
}
