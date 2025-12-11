#!/usr/bin/env node

import chalk from "chalk";

import { type FailureDetails } from "@/config/types";

import pkg from "../package.json";
import { Task, taskConfig } from "./config";
import { formatDuration, taskStateIcons } from "./helpers";
import {
  colorStatusMessage,
  printFailureDetails,
  renderTable,
} from "./renderers";
import { getRunOptions } from "./runOptions/runOptions";
import { type RunOptions } from "./runOptions/types";

const tableHeaders = ["Label", "Tool", "Results", "Time"];

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
  const runOptions = getRunOptions();

  const tasks: Task[] = taskConfig.map((config) => {
    return new Task(config, runOptions);
  });

  render(tasks, runOptions);

  await Promise.all(
    tasks.map((task) => {
      return executeTask(task, () => {
        render(tasks, runOptions);
      });
    })
  );

  suiteFinished = true;
  suiteDurationMs = Date.now() - suiteStartTime;

  render(tasks, runOptions, failures.length > 0 ? failures : null);

  process.exit(failures.length > 0 ? 1 : 0);
}

function render(
  tasks: Task[],
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

  const rows = tasks.map((task) => {
    const status = task.getStatus();
    const message =
      status.state === "pending"
        ? ""
        : colorStatusMessage(status.message, status.state);
    return [
      `${taskStateIcons[status.state]} ${task.label}`,
      task.tool,
      message,
      formatDuration(task.getDuration()),
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

async function executeTask(task: Task, render: () => void) {
  await task.execute({
    onStart: () => {
      render();
    },
    onFinish: () => {
      render();
    },
  });

  totalErrors += task.getTotalErrors();
  totalWarnings += task.getTotalWarnings();
  failures.push(...task.getFailures());
}
