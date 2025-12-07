#!/usr/bin/env node

import chalk from "chalk";
import { type ParsedFailure } from "parsers/types";

import pkg from "../package.json";
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
  type Step,
  type StepState,
  type StepStatus,
} from "./types";

const args = process.argv.slice(2);
const isLooseMode = args.includes("--loose");
const isSilentMode = args.includes("--silent");

const steps: Step[] = stepConfig.map((config) => {
  const supportsLoose = Boolean(config.looseCommand);
  return {
    label: decorateLabel(config.label, supportsLoose, isLooseMode),
    tool: config.tool,
    command: selectCommand(config.command, config.looseCommand, isLooseMode),
    parseFailure: parserMap[config.tool],
  };
});

const tableHeaders = ["Label", "Tool", "Results", "Time"];

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
  const rawCombined = [result.stdout, result.stderr].filter(Boolean).join("\n");
  const combined = stripAnsi(rawCombined);
  const parsedFailure = step.parseFailure?.(combined);

  if (result.status === 0 && !parsedFailure) {
    updateStatus(index, "success", "Passed");
  } else {
    const detail =
      parsedFailure?.message ?? "Failed - see output below for details";
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
});

suiteFinished = true;
render();

printFailureDetails(failures);

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
  console.log(
    chalk.bold(`${pkg.name} v${pkg.version}`) +
      " — Validating your code quality"
  );
  console.log();
  if (isLooseMode) {
    console.log(
      "(* indicates loose mode; some rules are disabled or set to warnings)\n"
    );
  }
  const rows = steps.map((step, idx) => {
    const status = statuses[idx];
    const message =
      status.state === "pending"
        ? ""
        : colorStatusMessage(status.message, status.state);
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
function printFailureDetails(failures: FailureDetails[]) {
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

function colorStatusMessage(message: string, state: StepState) {
  if (!message) {
    return "";
  }
  if (state === "failure") {
    return chalk.red(message);
  }
  if (state === "success") {
    return chalk.white(message);
  }
  return message;
}

function formatFailureHeadline(failure: FailureDetails) {
  const breakdownParts: string[] = [];
  if (typeof failure.errors === "number") {
    breakdownParts.push(
      chalk.red(`${failure.errors} error${failure.errors === 1 ? "" : "s"}`)
    );
  }
  if (typeof failure.warnings === "number") {
    breakdownParts.push(
      `${failure.warnings} warning${failure.warnings === 1 ? "" : "s"}`
    );
  }
  const detail =
    breakdownParts.length > 0
      ? breakdownParts.join(", ")
      : (failure.summary ?? "See output");
  const labelText = chalk.blue.underline(failure.label);
  const commandText = chalk.yellow(failure.command);
  const detailText = chalk.red(detail);
  return `${labelText} - ${failure.tool} [${commandText}] (${detailText})`;
}
