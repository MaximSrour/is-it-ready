#!/usr/bin/env node

import chalk from "chalk";
import { type ParsedFailure } from "parsers/types";

import { type Task, type TaskState, type TaskStatus } from "@/config/types";

import pkg from "../package.json";
import { taskConfig } from "./config";
import {
  formatDuration,
  runCommand,
  selectCommand,
  stripAnsi,
  taskStateIcons,
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

const tasks: Task[] = taskConfig.map((config) => {
  const executableCommand = selectCommand(config, runOptions);

  return {
    label: executableCommand.label,
    tool: config.tool,
    command: executableCommand.command,
    parseFailure: parserMap[config.tool],
  };
});

const tableHeaders = ["Label", "Tool", "Results", "Time"];

const statuses: TaskStatus[] = tasks.map(() => {
  return {
    state: "pending",
    message: "",
  };
});
const durations = tasks.map(() => {
  return null as number | null;
});
const failures: FailureDetails[] = [];
let totalErrors = 0;
let totalWarnings = 0;
let suiteFinished = false;
const suiteStartTime = Date.now();
let suiteDurationMs: number | null = null;

void main().catch((error) => {
  console.error(chalk.red("Unexpected error while running tasks."));
  console.error(error);
  process.exit(1);
});

async function main() {
  render(runOptions);
  await Promise.all(
    tasks.map((task, index) => {
      return executeTask(task, index);
    })
  );
  suiteFinished = true;
  suiteDurationMs = Date.now() - suiteStartTime;
  render(runOptions, failures.length > 0 ? failures : null);
  process.exit(failures.length > 0 ? 1 : 0);
}

function updateStatus(index: number, state: TaskState, message: string) {
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

  if (runOptions.isFixMode) {
    console.log(
      "(* indicates fix mode; some tasks will automatically apply fixes to your code)\n"
    );
  } else if (runOptions.isLooseMode) {
    console.log(
      "(* indicates loose mode; some rules are disabled or set to warnings)\n"
    );
  }

  if (failures) {
    printFailureDetails(failures, runOptions);
  }

  const rows = tasks.map((task, idx) => {
    const status = statuses[idx];
    const message =
      status.state === "pending"
        ? ""
        : colorStatusMessage(status.message, status.state);
    return [
      `${taskStateIcons[status.state]} ${task.label}`,
      task.tool,
      message,
      formatDuration(durations[idx]),
    ];
  });
  const overallIssues = totalErrors + totalWarnings;
  const overallIcon = suiteFinished
    ? overallIssues === 0
      ? taskStateIcons.success
      : taskStateIcons.failure
    : taskStateIcons.running;
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

async function executeTask(task: Task, index: number) {
  updateStatus(index, "running", "Running...");
  const startTime = Date.now();

  try {
    const result = await runCommand(task.command);
    durations[index] = Date.now() - startTime;
    const rawCombined = [result.stdout, result.stderr]
      .filter(Boolean)
      .join("\n");
    const combined = stripAnsi(rawCombined);
    const parsedFailure = task.parseFailure?.(combined);

    if (result.status === 0 && !parsedFailure) {
      updateStatus(index, "success", "Passed");
      return;
    }

    const detail =
      parsedFailure?.message ?? "Failed - see output below for details";
    updateStatus(index, "failure", detail);

    failures.push({
      label: task.label,
      tool: task.tool,
      command: task.command,
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
      label: task.label,
      tool: task.tool,
      command: task.command,
      summary: message,
      output: message,
      rawOutput: message,
    });

    recordIssueCounts();
  }
}
