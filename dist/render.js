"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFullWidthCodePoint = exports.getDisplayWidth = exports.padCell = exports.renderRow = exports.renderBorder = exports.renderTable = void 0;
const chalk_1 = __importDefault(require("chalk"));
const helpers_1 = require("./helpers");
const BORDER_CHARS = {
    top: { left: "┌", mid: "┬", right: "┐", fill: "─" },
    middle: { left: "├", mid: "┼", right: "┤", fill: "─" },
    bottom: { left: "└", mid: "┴", right: "┘", fill: "─" },
};
/**
 * Renders a table with borders, headers, rows, and an optional footer.
 *
 * @param {string[]} headers - array of header titles
 * @param {string[][]} rows - array of rows, each row is an array of cell values
 * @param {string[]} [footerRow] - optional footer row
 *
 * @returns {string} - rendered table string
 */
const renderTable = (headers, rows, footerRow) => {
    const columnWidths = headers.map((header, idx) => Math.max((0, exports.getDisplayWidth)(header), ...rows.map((row) => (0, exports.getDisplayWidth)(row[idx] ?? "")), footerRow ? (0, exports.getDisplayWidth)(footerRow[idx] ?? "") : 0));
    const topBorder = (0, exports.renderBorder)(columnWidths, "top");
    const headerRow = (0, exports.renderRow)(headers.map((header) => chalk_1.default.bold(header)), columnWidths);
    const headerSeparator = (0, exports.renderBorder)(columnWidths, "middle");
    const bodyRows = rows.map((row) => (0, exports.renderRow)(row, columnWidths)).join("\n");
    const footerSection = footerRow
        ? `\n${(0, exports.renderBorder)(columnWidths, "middle")}\n${(0, exports.renderRow)(footerRow.map((footer) => chalk_1.default.bold(footer)), columnWidths)}`
        : "";
    const bottomBorder = (0, exports.renderBorder)(columnWidths, "bottom");
    return `${topBorder}\n${headerRow}\n${headerSeparator}\n${bodyRows}${footerSection}\n${bottomBorder}`;
};
exports.renderTable = renderTable;
/**
 * Renders a table border using specified characters.
 *
 * @param {number[]} columnWidths - array of column widths
 * @param {BorderLevel} borderLevel - type of border to render
 *
 * @returns {string} - rendered border string
 */
const renderBorder = (columnWidths, borderLevel) => {
    const chars = BORDER_CHARS[borderLevel];
    const segments = columnWidths.map((width) => chars.fill.repeat(width + 2));
    return `${chars.left}${segments.join(chars.mid)}${chars.right}`;
};
exports.renderBorder = renderBorder;
/**
 * Renders a table row with padded cells.
 *
 * @param {string[]} row - array of cell values
 * @param {number[]} columnWidths - array of column widths
 *
 * @returns {string} - rendered row string
 */
const renderRow = (row, columnWidths) => {
    const paddedCells = row.map((cell, idx) => {
        return (0, exports.padCell)(cell, columnWidths[idx]);
    });
    return `│ ${paddedCells.join(" │ ")} │`;
};
exports.renderRow = renderRow;
/**
 * Pads a cell value to the specified width.
 *
 * @param {string} value - cell value
 * @param {number} columnWidth - desired width
 *
 * @returns {string} - padded cell value
 */
const padCell = (value, columnWidth) => {
    const currentWidth = (0, exports.getDisplayWidth)(value);
    if (currentWidth >= columnWidth) {
        return value;
    }
    return `${value}${" ".repeat(columnWidth - currentWidth)}`;
};
exports.padCell = padCell;
/**
 * Calculates the display width of a string, accounting for full-width characters.
 *
 * @param {string} value - input string
 *
 * @returns {number} - display width of the string
 */
const getDisplayWidth = (value) => {
    if (!value) {
        return 0;
    }
    const cleanValue = (0, helpers_1.stripAnsi)(value);
    const segmenter = typeof Intl !== "undefined"
        ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
        : null;
    const emojiRegex = /\p{Extended_Pictographic}/u;
    const graphemes = segmenter
        ? Array.from(segmenter.segment(cleanValue), (seg) => seg.segment)
        : Array.from(cleanValue);
    return graphemes.reduce((total, grapheme) => {
        const codePoint = grapheme.codePointAt(0);
        if ((0, exports.isFullWidthCodePoint)(codePoint) || emojiRegex.test(grapheme)) {
            return total + 2;
        }
        return total + 1;
    }, 0);
};
exports.getDisplayWidth = getDisplayWidth;
/**
 * Determines if a Unicode code point is a full-width character.
 * Full-width characters typically occupy two character cells in terminal displays.
 *
 * @param {number | null} codePoint - The Unicode code point to check.
 *
 * @returns {boolean} - True if the code point is full-width, false otherwise.
 */
const isFullWidthCodePoint = (codePoint) => {
    if (!codePoint) {
        return false;
    }
    return (codePoint >= 0x1100 &&
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
            (codePoint >= 0x20000 && codePoint <= 0x3fffd)));
};
exports.isFullWidthCodePoint = isFullWidthCodePoint;
