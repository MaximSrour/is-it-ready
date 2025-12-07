#!/usr/bin/env node

import { stepConfig } from "./config";
import {
  decorateLabel,
  formatDuration,
  runCommand,
  selectCommand,
  stripAnsi,
} from "./helpers";
import { parserMap } from "./parsers";
import { renderTable } from "./render";
import {
  type FailureDetails,
  type ParsedFailure,
  type Step,
  type StepState,
  type StepStatus,
} from "./types";

const args = process.argv.slice(2);
const isLooseMode = args.includes("--loose");

const steps: Step[] = stepConfig.map((config) => ({
  label: decorateLabel(
    config.label,
    config.supportsLoose ?? false,
    isLooseMode
  ),
  tool: config.tool,
  command: selectCommand(
    config.command,
    config.supportsLoose ?? false,
    isLooseMode
  ),
  parseFailure: parserMap[config.tool],
}));

const tableHeaders = ["Label", "Tool", "Status", "Time"];

const icons: Record<StepState, string> = {
  pending: "  ",
  running: "⏳",
  success: "✅",
  failure: "❌",
};

const statuses: StepStatus[] = steps.map(() => ({
  state: "pending",
  message: "",
}));
const durations = steps.map(() => null as number | null);
const failures: FailureDetails[] = [];
let totalErrors = 0;
let totalWarnings = 0;
let suiteFinished = false;

render();

steps.forEach((step, index) => {
  updateStatus(index, "running", "Running...");
  const startTime = Date.now();
  const result = runCommand(step.command);
  durations[index] = Date.now() - startTime;
  const combined = stripAnsi(
    [result.stdout, result.stderr].filter(Boolean).join("\n")
  );
  const parsedFailure = step.parseFailure?.(combined);

  if (result.status === 0 && !parsedFailure) {
    updateStatus(index, "success", "Passed");
  } else {
    const detail =
      parsedFailure?.message ?? "Failed - see output below for details";
    updateStatus(index, "failure", detail);
    failures.push({ label: step.label, output: combined.trim() });
    recordIssueCounts(parsedFailure);
  }
});

suiteFinished = true;
render();

// printFailureDetails();

process.exit(failures.length > 0 ? 1 : 0);

function updateStatus(index: number, state: StepState, message: string) {
  statuses[index] = { state, message };
  render();
}

function recordIssueCounts(parsedFailure?: ParsedFailure | null) {
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
    console.log(
      "(* indicates loose mode; some rules are disabled or set to warnings)\n"
    );
  }
  const rows = steps.map((step, idx) => {
    const status = statuses[idx];
    const message = status.state === "pending" ? "" : status.message;
    return [
      `${icons[status.state]} ${step.label}`,
      step.tool,
      message,
      formatDuration(durations[idx]),
    ];
  });
  const overallIssues = totalErrors + totalWarnings;
  const overallIcon = suiteFinished
    ? overallIssues === 0
      ? icons.success
      : icons.failure
    : icons.running;
  const overallDurationMs = durations.reduce(
    (total, current) => (total ?? 0) + (current ?? 0),
    0
  );
  const breakdownParts = [];
  if (totalErrors > 0) {
    breakdownParts.push(`${totalErrors} error${totalErrors === 1 ? "" : "s"}`);
  }
  if (totalWarnings > 0) {
    breakdownParts.push(
      `${totalWarnings} warning${totalWarnings === 1 ? "" : "s"}`
    );
  }
  const breakdown =
    breakdownParts.length > 0 ? ` (${breakdownParts.join(", ")})` : "";
  const overallRow = [
    `${overallIcon} Overall`,
    "",
    `${overallIssues} issue${overallIssues === 1 ? "" : "s"}${breakdown}`,
    formatDuration(overallDurationMs),
  ];
  console.log(renderTable(tableHeaders, rows, overallRow));
}

/**
 * Prints detailed information about failed steps.
 *
 * @param {FailureDetails[]} failures - Array of failure details to print
 */
function _printFailureDetails(failures: FailureDetails[]) {
  if (failures.length > 0) {
    console.log("\nDetails:");
    failures.forEach(({ label, output }) => {
      console.log(`\n--- ${label} ---`);
      console.log(output || "(no output)");
    });
  }
}
