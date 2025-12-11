import chalk from "chalk";

import { type RunOptions } from "@/runOptions/types";

import { type FailureDetails, type TaskState } from "../config/types";
import { stripAnsi } from "../helpers";
import { type BorderChars, type BorderLevel } from "./types";

const BORDER_CHARS: Record<BorderLevel, BorderChars> = {
  top: { left: "┌", mid: "┬", right: "┐", fill: "─" },
  middle: { left: "├", mid: "┼", right: "┤", fill: "─" },
  bottom: { left: "└", mid: "┴", right: "┘", fill: "─" },
} as const;

/**
 * Renders a table with borders, headers, rows, and an optional footer.
 *
 * @param {string[]} headers - array of header titles
 * @param {string[][]} rows - array of rows, each row is an array of cell values
 * @param {string[]} [footerRow] - optional footer row
 *
 * @returns {string} - rendered table string
 */
export const renderTable = (
  headers: string[],
  rows: string[][],
  footerRow?: string[]
) => {
  const columnWidths = headers.map((header, idx) => {
    return Math.max(
      getDisplayWidth(header),
      ...rows.map((row) => {
        return getDisplayWidth(row[idx] ?? "");
      }),
      footerRow ? getDisplayWidth(footerRow[idx] ?? "") : 0
    );
  });

  const topBorder = renderBorder(columnWidths, "top");
  const headerRow = renderRow(
    headers.map((header) => {
      return chalk.bold(header);
    }),
    columnWidths
  );
  const headerSeparator = renderBorder(columnWidths, "middle");
  const bodyRows = rows
    .map((row) => {
      return renderRow(row, columnWidths);
    })
    .join("\n");
  const footerSection = footerRow
    ? `\n${renderBorder(columnWidths, "middle")}\n${renderRow(
        footerRow.map((footer) => {
          return chalk.bold(footer);
        }),
        columnWidths
      )}`
    : "";
  const bottomBorder = renderBorder(columnWidths, "bottom");

  return `${topBorder}\n${headerRow}\n${headerSeparator}\n${bodyRows}${footerSection}\n${bottomBorder}`;
};

/**
 * Renders a table border using specified characters.
 *
 * @param {number[]} columnWidths - array of column widths
 * @param {BorderLevel} borderLevel - type of border to render
 *
 * @returns {string} - rendered border string
 */
export const renderBorder = (
  columnWidths: number[],
  borderLevel: BorderLevel
) => {
  const chars = BORDER_CHARS[borderLevel];
  const segments = columnWidths.map((width) => {
    return chars.fill.repeat(width + 2);
  });

  return `${chars.left}${segments.join(chars.mid)}${chars.right}`;
};

/**
 * Renders a table row with padded cells.
 *
 * @param {string[]} row - array of cell values
 * @param {number[]} columnWidths - array of column widths
 *
 * @returns {string} - rendered row string
 */
export const renderRow = (row: string[], columnWidths: number[]) => {
  const paddedCells = row.map((cell, idx) => {
    return padCell(cell, columnWidths[idx]);
  });

  return `│ ${paddedCells.join(" │ ")} │`;
};

/**
 * Pads a cell value to the specified width.
 *
 * @param {string} value - cell value
 * @param {number} columnWidth - desired width
 *
 * @returns {string} - padded cell value
 */
export const padCell = (value: string, columnWidth: number) => {
  const currentWidth = getDisplayWidth(value);

  if (currentWidth >= columnWidth) {
    return value;
  }

  return `${value}${" ".repeat(columnWidth - currentWidth)}`;
};

/**
 * Calculates the display width of a string, accounting for full-width characters.
 *
 * @param {string} value - input string
 *
 * @returns {number} - display width of the string
 */
export const getDisplayWidth = (value: string) => {
  if (!value) {
    return 0;
  }

  const cleanValue = stripAnsi(value);

  const segmenter =
    typeof Intl !== "undefined"
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;

  const emojiRegex = /\p{Extended_Pictographic}/u;

  const graphemes = segmenter
    ? Array.from(segmenter.segment(cleanValue), (seg) => {
        return seg.segment;
      })
    : Array.from(cleanValue);

  return graphemes.reduce((total, grapheme) => {
    const codePoint = grapheme.codePointAt(0);

    if (isFullWidthCodePoint(codePoint) || emojiRegex.test(grapheme)) {
      return total + 2;
    }

    return total + 1;
  }, 0);
};

/**
 * Determines if a Unicode code point is a full-width character.
 * Full-width characters typically occupy two character cells in terminal displays.
 *
 * @param {number | null} codePoint - The Unicode code point to check.
 *
 * @returns {boolean} - True if the code point is full-width, false otherwise.
 */
export const isFullWidthCodePoint = (codePoint?: number | null) => {
  if (!codePoint) {
    return false;
  }

  return (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0x3247 && codePoint !== 0x303f) ||
      (codePoint >= 0x3250 && codePoint <= 0x4dbf) ||
      (codePoint >= 0x4e00 && codePoint <= 0xa4c6) ||
      (codePoint >= 0xa960 && codePoint <= 0xa97c) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6b) ||
      (codePoint >= 0xff01 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      (codePoint >= 0x1b000 && codePoint <= 0x1b001) ||
      (codePoint >= 0x1f200 && codePoint <= 0x1f251) ||
      (codePoint >= 0x20000 && codePoint <= 0x3fffd))
  );
};

/**
 * Colors a status message based on the task state.
 *
 * @param {string} message - The status message to color.
 * @param {TaskState} state - The state of the task ("pending", "running", "success", "failure").
 *
 * @returns {string} - The colored status message.
 */
export const colorStatusMessage = (message: string, state: TaskState) => {
  if (!message) {
    return "";
  }

  if (state === "failure") {
    return chalk.red(message);
  }

  return message;
};

/**
 * Builds a formatted string summarizing failure details for display.
 *
 * @param {FailureDetails} failure - metadata describing the failed task
 *
 * @returns {string} - decorated headline containing label, tool, command, and breakdown
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
 * @param {FailureDetails[]} failures - Array of failure details to print
 * @param {RunOptions} runOptions - Options that influenced the run
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
