import chalk from "chalk";

import pkg from "../../package.json";
import { type Config } from "../config/types";
import { formatDuration, taskStateIcons } from "../helpers";
import { type RunOptions } from "../runOptions/types";
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
      const output = runOptions.isNoColor
        ? failure.output || "(no output)"
        : failure.rawOutput || failure.output || "(no output)";
      console.log(output);
    });

    console.log();
  }
};

export const formatUnsupportedTools = (unsupportedTools: string[]) => {
  const quotedTools = unsupportedTools.map((tool) => {
    return `\`${tool}\``;
  });

  if (quotedTools.length === 0) {
    return "";
  }

  if (quotedTools.length === 1) {
    return quotedTools[0];
  }

  if (quotedTools.length === 2) {
    return `${quotedTools[0]} and ${quotedTools[1]}`;
  }

  const leadingTools = quotedTools.slice(0, -1).join(", ");
  const lastTool = quotedTools.at(-1);

  return `${leadingTools}, and ${lastTool}`;
};

/**
 * Renders the current status of all tasks to the console.
 *
 * @param {Config} config - Config and task metadata to render.
 * @param {RunOptions} runOptions - Options that influenced the run.
 */
export const render = (config: Config, runOptions: RunOptions) => {
  const { tasks, unsupportedTools } = config;

  const timeNow = Date.now();

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
    return ["success", "failure", "cancelled"].includes(state);
  });
  const hasFailures = tasks.some((task) => {
    const state = task.getStatus().state;
    return ["failure", "cancelled"].includes(state);
  });

  const failures: FailureDetails[] = [];
  tasks.forEach((task) => {
    failures.push(...task.getFailures());
  });

  if (suiteFinished) {
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
    const { hasStartedTask, startTime, effectiveEndTime } = tasks.reduce(
      (acc, task) => {
        const start = task.getStartTime();
        const end = task.getEndTime();

        if (start !== null) {
          return {
            hasStartedTask: true,
            startTime: Math.min(acc.startTime, start),
            effectiveEndTime: Math.max(
              acc.effectiveEndTime,
              end ?? (suiteFinished ? start : timeNow)
            ),
          };
        }

        return acc;
      },
      {
        hasStartedTask: false,
        startTime: Number.POSITIVE_INFINITY,
        effectiveEndTime: Number.NEGATIVE_INFINITY,
      }
    );

    if (!hasStartedTask) {
      return { suiteStartTime: null, suiteDurationMs: 0 };
    }

    return {
      suiteStartTime: startTime,
      suiteDurationMs: effectiveEndTime - startTime,
    };
  })();

  const overallIcon = suiteFinished
    ? !hasFailures
      ? taskStateIcons.success
      : taskStateIcons.failure
    : taskStateIcons.running;

  const overallDurationMs = suiteFinished
    ? suiteDurationMs
    : suiteStartTime
      ? timeNow - suiteStartTime
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

  if (unsupportedTools.length > 0) {
    const verb = unsupportedTools.length === 1 ? "isn't" : "aren't";
    const noun = unsupportedTools.length === 1 ? "tool" : "tools";
    console.log(
      chalk.yellow(
        `Warning: ${formatUnsupportedTools(unsupportedTools)} ${noun} ${verb} directly supported; using exit codes only.`
      )
    );
  }

  if (runOptions.isWatchMode) {
    console.log(
      chalk.cyan("\nWatching for file changes... (press Ctrl+C to exit)")
    );
  }
};
