import chalk from "chalk";

import { stripAnsi } from "../../helpers";
import { type BorderChars, type BorderLevel } from "./types";

const BORDER_CHARS: Record<BorderLevel, BorderChars> = {
  top: { left: "┌", mid: "┬", right: "┐", fill: "─" },
  middle: { left: "├", mid: "┼", right: "┤", fill: "─" },
  bottom: { left: "└", mid: "┴", right: "┘", fill: "─" },
} as const;

const TABLE_HEADERS = ["Label", "Tool", "Results", "Time"];

/**
 * Renders a table with borders, headers, rows, and an optional footer.
 *
 * @param {string[][]} rows - Array of rows, each row is an array of cell values.
 * @param {string[]} [footerRow] - Optional footer row.
 * @returns {string} - Rendered table string.
 */
export const renderTable = (rows: string[][], footerRow?: string[]) => {
  const columnWidths = TABLE_HEADERS.map((header, idx) => {
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
    TABLE_HEADERS.map((header) => {
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
 * @param {number[]} columnWidths - Array of column widths.
 * @param {BorderLevel} borderLevel - Type of border to render.
 * @returns {string} - Rendered border string.
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
 * @param {string[]} row - Array of cell values.
 * @param {number[]} columnWidths - Array of column widths.
 * @returns {string} - Rendered row string.
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
 * @param {string} value - Cell value.
 * @param {number} columnWidth - Desired width.
 * @returns {string} - Padded cell value.
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
 * @param {string} value - Input string.
 * @returns {number} - Display width of the string.
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
