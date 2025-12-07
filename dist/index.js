#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const helpers_1 = require("./helpers");
const parsers_1 = require("./parsers");
const render_1 = require("./render");
const args = process.argv.slice(2);
const isLooseMode = args.includes("--loose");
const steps = config_1.stepConfig.map((config) => ({
    label: (0, helpers_1.decorateLabel)(config.label, config.supportsLoose ?? false, isLooseMode),
    tool: config.tool,
    command: (0, helpers_1.selectCommand)(config.command, config.supportsLoose ?? false, isLooseMode),
    parseFailure: parsers_1.parserMap[config.tool],
}));
const tableHeaders = ["Label", "Tool", "Status", "Time"];
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
render();
steps.forEach((step, index) => {
    updateStatus(index, "running", "Running...");
    const startTime = Date.now();
    const result = (0, helpers_1.runCommand)(step.command);
    durations[index] = Date.now() - startTime;
    const combined = (0, helpers_1.stripAnsi)([result.stdout, result.stderr].filter(Boolean).join("\n"));
    const parsedFailure = step.parseFailure?.(combined);
    if (result.status === 0 && !parsedFailure) {
        updateStatus(index, "success", "Passed");
    }
    else {
        const detail = parsedFailure?.message ?? "Failed - see output below for details";
        updateStatus(index, "failure", detail);
        failures.push({ label: step.label, output: combined.trim() });
        recordIssueCounts(parsedFailure);
    }
});
suiteFinished = true;
render();
// printFailureDetails();
process.exit(failures.length > 0 ? 1 : 0);
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
    console.log("Running project checks:\n");
    if (isLooseMode) {
        console.log("(* indicates loose mode; some rules are disabled or set to warnings)\n");
    }
    const rows = steps.map((step, idx) => {
        const status = statuses[idx];
        const message = status.state === "pending" ? "" : status.message;
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
    const overallDurationMs = durations.reduce((total, current) => (total ?? 0) + (current ?? 0), 0);
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
/**
 * Prints detailed information about failed steps.
 *
 * @param {FailureDetails[]} failures - Array of failure details to print
 */
function _printFailureDetails(failures) {
    if (failures.length > 0) {
        console.log("\nDetails:");
        failures.forEach(({ label, output }) => {
            console.log(`\n--- ${label} ---`);
            console.log(output || "(no output)");
        });
    }
}
