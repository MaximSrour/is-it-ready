#!/usr/bin/env node

import chalk from "chalk";
import { type ParsedFailure } from "parsers/types";

import { type Step, type StepState, type StepStatus } from "@/config/types";

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
import {
  colorStatusMessage,
  printFailureDetails,
  renderTable,
} from "./renderers";
import { getRunOptions } from "./runOptions/runOptions";
import { type RunOptions } from "./runOptions/types";
import { type FailureDetails } from "./types";

const runOptions = getRunOptions();

const steps: Step[] = stepConfig.map((config) => {
  const supportsLoose = Boolean(config.looseCommand);
  return {
    label: decorateLabel(config.label, supportsLoose, runOptions.isLooseMode),
    tool: config.tool,
    command: selectCommand(
      config.command,
      config.looseCommand,
      config.fixCommand,
      runOptions
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

const statuses: StepStatus[] = steps.map(() => {
  return {
    state: "pending",
    message: "",
  };
});
const durations = steps.map(() => {
  return null as number | null;
});
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
  await Promise.all(
    steps.map((step, index) => {
      return executeStep(step, index);
    })
  );
  suiteFinished = true;
  suiteDurationMs = Date.now() - suiteStartTime;
  render(runOptions, failures.length > 0 ? failures : null);
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

function render(
  runOptions: RunOptions,
  failures: FailureDetails[] | null = null
) {
  if (process.stdout.isTTY) {
    console.clear();
  }
  console.log(
    chalk.bold(`\n${pkg.name} v${pkg.version}`) +
      " — Validating your code quality"
  );
  console.log();
  if (runOptions.isLooseMode) {
    console.log(
      "(* indicates loose mode; some rules are disabled or set to warnings)\n"
    );
  }

  if (failures) {
    printFailureDetails(failures, runOptions);
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
