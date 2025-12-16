import chalk from "chalk";

import { type RunOptions } from "@/runOptions/types";
import { type Task } from "@/task/task";

import pkg from "../../package.json";
import { formatDuration, taskStateIcons } from "../helpers";
import { type FailureDetails } from "../task/types";
import { renderTable } from "./tableRenderer";

/**
 * Builds a formatted string summarizing failure details for display.
 *
 * @param {FailureDetails} failure - Metadata describing the failed task.
 * @returns {string} - Decorated headline containing label, tool, command, and breakdown.
 */
export const formatFailureHeadline = (failure: FailureDetails) => {
  const breakdownParts: string[] = [];

  if (typeof failure.errors === "number") {
    breakdownParts.push(
      chalk.red(`${failure.errors} error${failure.errors === 1 ? "" : "s"}`)
    );
  }

  if (typeof failure.warnings === "number") {
    breakdownParts.push(
      chalk.yellow(
        `${failure.warnings} warning${failure.warnings === 1 ? "" : "s"}`
      )
    );
  }

  const detail =
    breakdownParts.length > 0
      ? breakdownParts.join(", ")
      : (failure.summary ?? "See output");

  const labelText = chalk.blue.underline(failure.label);
  const toolText = failure.tool;
  const commandText = chalk.yellow(failure.command);
  const detailText = chalk.red(detail);

  return `${labelText} - ${toolText} [${commandText}] (${detailText})`;
};

/**
 * Prints detailed information about failed tasks.
 *
 * @param {FailureDetails[]} failures - Array of failure details to print.
 * @param {RunOptions} runOptions - Options that influenced the run.
 */
export const printFailureDetails = (
  failures: FailureDetails[],
  runOptions: RunOptions
) => {
  if (failures.length > 0) {
    if (runOptions.isSilentMode) {
      console.log("Some checks failed. Run without --silent to see details.");
      return;
    }

    console.log("Details:");

    failures.forEach((failure) => {
      const headline = formatFailureHeadline(failure);
      console.log(`\n${headline}`);
      console.log(failure.rawOutput || failure.output || "(no output)");
    });

    console.log();
  }
};

/**
 * Renders the current status of all tasks to the console.
 *
 * @param {Task[]} tasks - Array of tasks to render.
 * @param {RunOptions} runOptions - Options that influenced the run.
 */
export const render = (tasks: Task[], runOptions: RunOptions) => {
  if (process.stdout.isTTY) {
    console.clear();
  }
  console.log(
    chalk.bold(`\n${pkg.name} v${pkg.version}`) +
      " — Validating your code quality\n"
  );

  if (runOptions.isFixMode) {
    console.log(
      "(* indicates fix mode; some tasks will automatically apply fixes to your code)\n"
    );
  }

  const suiteFinished = tasks.every((task) => {
    const state = task.getStatus().state;
    return state === "success" || state === "failure";
  });

  const failures: FailureDetails[] = [];
  tasks.forEach((task) => {
    failures.push(...task.getFailures());
  });

  if (failures.length > 0 && suiteFinished) {
    printFailureDetails(failures, runOptions);
  }

  const { totalErrors, totalWarnings, totalIssues } = tasks.reduce(
    (sum, task) => {
      sum.totalErrors += task.getTotalErrors();
      sum.totalWarnings += task.getTotalWarnings();
      sum.totalIssues += task.getTotalErrors() + task.getTotalWarnings();
      return sum;
    },
    { totalErrors: 0, totalWarnings: 0, totalIssues: 0 }
  );

  const { suiteStartTime, suiteDurationMs } = (() => {
    const result = tasks.reduce(
      (acc, task) => {
        const start = task.getStartTime();
        const end = task.getEndTime();

        if (start !== null && end !== null) {
          acc.suiteStartTime =
            acc.suiteStartTime === 0
              ? start
              : Math.min(acc.suiteStartTime, start);
          acc.suiteEndTime = Math.max(acc.suiteEndTime, end);
        }

        return acc;
      },
      { suiteStartTime: 0, suiteEndTime: 0 }
    );

    return {
      suiteStartTime:
        result.suiteStartTime === Infinity ? null : result.suiteStartTime,
      suiteDurationMs: result.suiteEndTime - result.suiteStartTime,
    };
  })();

  const overallIcon = suiteFinished
    ? totalIssues === 0
      ? taskStateIcons.success
      : taskStateIcons.failure
    : taskStateIcons.running;

  const overallDurationMs = suiteFinished
    ? suiteDurationMs
    : suiteStartTime
      ? Date.now() - suiteStartTime
      : 0;

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
    `${totalIssues} issue${totalIssues === 1 ? "" : "s"}${breakdown}`,
    formatDuration(overallDurationMs),
  ];

  console.log(renderTable(tasks, overallRow));

  if (runOptions.isWatchMode) {
    console.log(
      chalk.cyan("\nWatching for file changes... (press Ctrl+C to exit)")
    );
  }
};
