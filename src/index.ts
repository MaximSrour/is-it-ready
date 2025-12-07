#!/usr/bin/env node

import chalk from "chalk";
import { type ParsedFailure } from "parsers/types";

import pkg from "../package.json";
import { stepConfig } from "./config";
import {
  decorateLabel,
  formatDuration,
  getRunOptions,
  runCommand,
  selectCommand,
  stripAnsi,
} from "./helpers";
import { parserMap } from "./parsers";
import { colorStatusMessage, renderTable } from "./render";
import {
  type FailureDetails,
  type RunOptions,
  type Step,
  type StepState,
  type StepStatus,
} from "./types";

const runOptions = getRunOptions();

const steps: Step[] = stepConfig.map((config) => {
  const supportsLoose = Boolean(config.looseCommand);
  return {
    label: decorateLabel(config.label, supportsLoose, runOptions.isLooseMode),
    tool: config.tool,
    command: selectCommand(
      config.command,
      config.looseCommand,
      runOptions.isLooseMode
    ),
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
const suiteStartTime = Date.now();
let suiteDurationMs: number | null = null;

void main().catch((error) => {
  console.error(chalk.red("Unexpected error while running steps."));
  console.error(error);
  process.exit(1);
});

async function main() {
  render(runOptions);
  await Promise.all(steps.map((step, index) => executeStep(step, index)));
  suiteFinished = true;
  suiteDurationMs = Date.now() - suiteStartTime;
  render(runOptions);
  printFailureDetails(failures, runOptions);
  process.exit(failures.length > 0 ? 1 : 0);
}

function updateStatus(index: number, state: StepState, message: string) {
  statuses[index] = { state, message };
  render(runOptions);
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

function render(runOptions: RunOptions) {
  if (process.stdout.isTTY) {
    console.clear();
  }
  console.log(
    chalk.bold(`${pkg.name} v${pkg.version}`) +
      " — Validating your code quality"
  );
  console.log();
  if (runOptions.isLooseMode) {
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
  const overallDurationMs = suiteFinished
    ? (suiteDurationMs ?? 0)
    : Date.now() - suiteStartTime;
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

async function executeStep(step: Step, index: number) {
  updateStatus(index, "running", "Running...");
  const startTime = Date.now();

  try {
    const result = await runCommand(step.command);
    durations[index] = Date.now() - startTime;
    const rawCombined = [result.stdout, result.stderr]
      .filter(Boolean)
      .join("\n");
    const combined = stripAnsi(rawCombined);
    const parsedFailure = step.parseFailure?.(combined);

    if (result.status === 0 && !parsedFailure) {
      updateStatus(index, "success", "Passed");
      return;
    }

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
  } catch (error) {
    durations[index] = Date.now() - startTime;
    const message =
      error instanceof Error
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
function printFailureDetails(
  failures: FailureDetails[],
  runOptions: RunOptions
) {
  if (failures.length > 0) {
    if (runOptions.isSilentMode) {
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
